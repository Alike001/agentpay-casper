use std::collections::{HashMap, HashSet};

#[derive(Clone, Debug, PartialEq, Eq)]
pub enum AgentStatus {
    Active,
    Revoked,
}

#[derive(Clone, Debug)]
pub struct Agent {
    pub id: String,
    pub owner: String,
    pub metadata_hash: String,
    pub status: AgentStatus,
}

#[derive(Clone, Debug)]
pub struct Policy {
    pub agent_id: String,
    pub max_amount_per_action: u64,
    pub daily_budget: u64,
    pub used_budget: u64,
    pub allowed_service_ids: HashSet<String>,
    pub approval_threshold: u64,
    pub active: bool,
    pub policy_hash: String,
}

#[derive(Clone, Debug)]
pub struct Service {
    pub id: String,
    pub endpoint_hash: String,
    pub pricing_hash: String,
    pub active: bool,
}

#[derive(Clone, Debug, PartialEq, Eq)]
pub struct Receipt {
    pub id: String,
    pub agent_id: String,
    pub service_id: String,
    pub action_hash: String,
    pub result_hash: String,
    pub amount: u64,
    pub policy_hash: String,
}

#[derive(Clone, Debug, PartialEq, Eq)]
pub enum Decision {
    Allowed,
    AgentRevoked,
    PolicyDisabled,
    ServiceNotAllowed,
    InvalidService,
    AmountOverLimit,
    BudgetExceeded,
    DuplicateAction,
}

#[derive(Default)]
pub struct AgentSafeState {
    agents: HashMap<String, Agent>,
    policies: HashMap<String, Policy>,
    services: HashMap<String, Service>,
    receipts: Vec<Receipt>,
    idempotency_keys: HashSet<String>,
}

impl AgentSafeState {
    pub fn register_agent(&mut self, id: &str, owner: &str, metadata_hash: &str) {
        self.agents.insert(
            id.to_string(),
            Agent {
                id: id.to_string(),
                owner: owner.to_string(),
                metadata_hash: metadata_hash.to_string(),
                status: AgentStatus::Active,
            },
        );
    }

    pub fn revoke_agent(&mut self, id: &str) {
        if let Some(agent) = self.agents.get_mut(id) {
            agent.status = AgentStatus::Revoked;
        }
    }

    pub fn set_policy(&mut self, policy: Policy) {
        self.policies.insert(policy.agent_id.clone(), policy);
    }

    pub fn register_service(&mut self, service: Service) {
        self.services.insert(service.id.clone(), service);
    }

    pub fn evaluate(
        &self,
        agent_id: &str,
        service_id: &str,
        amount: u64,
        idempotency_key: &str,
    ) -> Decision {
        let Some(agent) = self.agents.get(agent_id) else {
            return Decision::AgentRevoked;
        };
        if agent.status == AgentStatus::Revoked {
            return Decision::AgentRevoked;
        }

        let Some(policy) = self.policies.get(agent_id) else {
            return Decision::PolicyDisabled;
        };
        if !policy.active {
            return Decision::PolicyDisabled;
        }

        let Some(service) = self.services.get(service_id) else {
            return Decision::InvalidService;
        };
        if !service.active {
            return Decision::InvalidService;
        }

        if !policy.allowed_service_ids.contains(service_id) {
            return Decision::ServiceNotAllowed;
        }
        if self.idempotency_keys.contains(idempotency_key) {
            return Decision::DuplicateAction;
        }
        if amount > policy.max_amount_per_action {
            return Decision::AmountOverLimit;
        }
        if policy.used_budget + amount > policy.daily_budget {
            return Decision::BudgetExceeded;
        }

        Decision::Allowed
    }

    pub fn write_receipt(
        &mut self,
        agent_id: &str,
        service_id: &str,
        amount: u64,
        idempotency_key: &str,
        result_hash: &str,
    ) -> Result<Receipt, Decision> {
        let decision = self.evaluate(agent_id, service_id, amount, idempotency_key);
        if decision != Decision::Allowed {
            return Err(decision);
        }

        let policy = self.policies.get_mut(agent_id).expect("policy evaluated");
        policy.used_budget += amount;
        self.idempotency_keys.insert(idempotency_key.to_string());

        let receipt = Receipt {
            id: format!("rcpt-{:04}", self.receipts.len() + 1),
            agent_id: agent_id.to_string(),
            service_id: service_id.to_string(),
            action_hash: format!("hash-action-{idempotency_key}"),
            result_hash: result_hash.to_string(),
            amount,
            policy_hash: policy.policy_hash.clone(),
        };
        self.receipts.push(receipt.clone());
        Ok(receipt)
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    fn fixture() -> AgentSafeState {
        let mut state = AgentSafeState::default();
        state.register_agent("agent-rwa-001", "owner", "hash-agent");
        state.register_service(Service {
            id: "svc-rwa-risk".to_string(),
            endpoint_hash: "hash-endpoint".to_string(),
            pricing_hash: "hash-pricing".to_string(),
            active: true,
        });
        state.set_policy(Policy {
            agent_id: "agent-rwa-001".to_string(),
            max_amount_per_action: 25,
            daily_budget: 50,
            used_budget: 0,
            allowed_service_ids: HashSet::from(["svc-rwa-risk".to_string()]),
            approval_threshold: 20,
            active: true,
            policy_hash: "hash-policy".to_string(),
        });
        state
    }

    #[test]
    fn writes_allowed_receipt() {
        let mut state = fixture();
        let receipt = state
            .write_receipt("agent-rwa-001", "svc-rwa-risk", 10, "once", "hash-result")
            .expect("receipt");
        assert_eq!(receipt.id, "rcpt-0001");
        assert_eq!(receipt.amount, 10);
    }

    #[test]
    fn blocks_overspend() {
        let state = fixture();
        assert_eq!(
            state.evaluate("agent-rwa-001", "svc-rwa-risk", 100, "once"),
            Decision::AmountOverLimit
        );
    }

    #[test]
    fn blocks_revoked_agent() {
        let mut state = fixture();
        state.revoke_agent("agent-rwa-001");
        assert_eq!(
            state.evaluate("agent-rwa-001", "svc-rwa-risk", 10, "once"),
            Decision::AgentRevoked
        );
    }
}
