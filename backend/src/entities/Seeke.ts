import { WalletInterface, WalletClient, TopicBroadcaster, LookupResolver } from '@bsv/sdk'
import type { EscrowRecord } from '../constants.js'

export default class Seeker {
    private derivedPublicKey: string | null = null

    constructor (
        private contractType: 'bounty' | 'bid',
        private readonly maxAllowedBids: number = 7,
        private readonly escrowServiceFeePercent: number = 1.3,
        private readonly wallet: WalletInterface = new WalletClient('auto', 'localhost'),
        private readonly topic: string = 'tm_escrow',
        private readonly broadcaster: TopicBroadcaster = new TopicBroadcaster([this.topic]),
        private readonly service: string = 'ls_escrow',
        private readonly resolver: LookupResolver = new LookupResolver(),
        private readonly keyDerivationProtocol = 'escrow'
    ) {
    }

    async seek (thing: number[], bounty?: number): Promise<EscrowRecord> {
        if (typeof bounty !== 'number') {
            this.contractType = 'bid'
        }
        // get your own public key
        await this.populateDerivedPublicKey()

        // construct the contract
        // If mode is bid, put 1 sat. Otherwise put the given amount
        // create the transaction
        // register it on the overlay
    }

    async getMyOpenContracts(): Promise<Array<EscrowRecord>> {
        // Get our own public key
        await this.populateDerivedPublicKey()
        // Query lookup service for our contracts
        // Decode them from the locking scripts
        // Return the parsed data
        return []
    }

    async cancelBeforeAccept(contract: EscrowRecord): Promise<void> {
        // ensure contract is in initial state
        // Call the cancel method
        // Create a transaction unlocking the UTXO
        // Register the transaction with the overlay
    }

    async increaseBounty(record: EscrowRecord, increaseBy: number) {
        // Verify contract is bounty and in initial state
        // Spend the old UTXO
        // Register transaction with overlay
    }

    async approveBid(record: EscrowRecord, bidIndex: number) {
        // Ensure type is bid and state is initial
        // Ensure bid not out of range
        // Set bidder key as furnisher
        // Set state to active-work
        // Replace UTXO, putting up the money
        // Register with overlay
    }

    async approveBountySolver(record: EscrowRecord, bidIndex: number) {
        // no need to put up the money (it's already there)
        // verify bidder key is in range
        // Set bidder key as furnisher
        // Set state to active-work
        // Replace UTXO, updating overlay
    }

    async cancelBidApprovalAfterDelay(record: EscrowRecord) {
        // Verify the state is bid-accepted
        // State goes back to initial
    }

    async approveCompletedWork(record: EscrowRecord) {
        // Verify the state is submitted-work
        // Sign, state goes to resolved
        // Update overlay
    }

    async disputeWork(record: EscrowRecord, evidence?: number[]) {
        // State must be active-work (timeout expired) or submitted-work
        // Sign (dispute evidence? optional.)
        // State goes to disputed
        // Register with the overlay
        // Compose a message to the platfom containing TXID and possibly evidence
    }

    listDisputes(active?: boolean) {
        // true = only active
        // false = only historical
        // undefined = both
        // Active disputes are still on the overlay
        // Records of past disputes are stored in local baskets
    }

    async reclaimAfterDispute(record: EscrowRecord, reconstitute?: boolean) {
        // List messages in disputes message box
        // Internalize any payouts to the wallet
        // Make record of a dispute by keeping a new PushDrop in a basket
        // If the user wants, re-create the contract again with the same money
    }

    private async populateDerivedPublicKey() {
        if (typeof this.derivedPublicKey !== 'string') {
            const { publicKey } = await this.wallet.getPublicKey({
                counterparty: 'self',
                protocolID: [2, this.keyDerivationProtocol],
                keyID: '1'
            })
            this.derivedPublicKey = publicKey
        }
    }
}