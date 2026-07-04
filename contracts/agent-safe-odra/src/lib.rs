#![cfg_attr(not(test), no_std)]
#![cfg_attr(not(test), no_main)]
extern crate alloc;

use alloc::string::String;
use odra::prelude::*;

#[odra::module]
pub struct ReceiptLedger {
    receipt_count: Var<u64>,
    last_receipt_id: Var<String>,
    last_agent_id: Var<String>,
    last_service_id: Var<String>,
    last_action_hash: Var<String>,
    last_result_hash: Var<String>,
    last_policy_hash: Var<String>,
    last_amount: Var<u64>,
}

#[odra::module]
impl ReceiptLedger {
    pub fn init(&mut self) {
        self.receipt_count.set(0);
    }

    pub fn write_receipt(
        &mut self,
        agent_id: String,
        service_id: String,
        action_hash: String,
        result_hash: String,
        policy_hash: String,
        amount: u64,
    ) -> String {
        let next_id = self.receipt_count.get_or_default() + 1;
        let receipt_id = String::from("receipt-latest");

        self.receipt_count.set(next_id);
        self.last_receipt_id.set(receipt_id.clone());
        self.last_agent_id.set(agent_id);
        self.last_service_id.set(service_id);
        self.last_action_hash.set(action_hash);
        self.last_result_hash.set(result_hash);
        self.last_policy_hash.set(policy_hash);
        self.last_amount.set(amount);

        receipt_id
    }

    pub fn receipt_count(&self) -> u64 {
        self.receipt_count.get_or_default()
    }

    pub fn last_receipt_id(&self) -> String {
        self.last_receipt_id.get_or_default()
    }

    pub fn last_agent_id(&self) -> String {
        self.last_agent_id.get_or_default()
    }

    pub fn last_amount(&self) -> u64 {
        self.last_amount.get_or_default()
    }
}

#[cfg(test)]
mod tests {
    use super::ReceiptLedger;
    use odra::host::{Deployer, NoArgs};

    #[test]
    fn writes_receipt_commitment() {
        let env = odra_test::env();
        let mut ledger = ReceiptLedger::deploy(&env, NoArgs);

        let receipt_id = ledger.write_receipt(
            "agent-rwa-001".to_string(),
            "svc-rwa-risk".to_string(),
            "hash-action".to_string(),
            "hash-result".to_string(),
            "hash-policy".to_string(),
            10,
        );

        assert_eq!(receipt_id, "receipt-latest");
        assert_eq!(ledger.receipt_count(), 1);
        assert_eq!(ledger.last_agent_id(), "agent-rwa-001");
        assert_eq!(ledger.last_amount(), 10);
    }
}
