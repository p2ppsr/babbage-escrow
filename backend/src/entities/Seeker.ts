import { WalletInterface, WalletClient, TopicBroadcaster, LookupResolver, Transaction } from '@bsv/sdk'
import type { EscrowRecord, GlobalConfig } from '../constants.js'
import { PubKey, toByteString } from 'scrypt-ts'
import { EscrowContract } from '../contracts/Escrow.js'
import escrowArtifact from '../../artifacts/Escrow.json' with { type: 'json' }
EscrowContract.loadArtifact(escrowArtifact)

export default class Seeker {
    private derivedPublicKey: string | null = null

    constructor (
        private readonly globalConfig: GlobalConfig,
        private readonly wallet: WalletInterface = new WalletClient('auto', 'localhost'),
        private readonly broadcaster: TopicBroadcaster = new TopicBroadcaster([this.globalConfig.topic]),
        private readonly resolver: LookupResolver = new LookupResolver()
    ) {}

    async seek (
        workDescription: string,
        workCompletionDeadline: number,
        bounty: number = 1
    ): Promise<void> {
        // get your own public key
        await this.populateDerivedPublicKey()

        // construct the contract
        const escrow = new EscrowContract(
            PubKey(toByteString(this.derivedPublicKey as string)),
            PubKey(toByteString(this.globalConfig.platformKey)),
            BigInt(this.globalConfig.escrowServiceFeeBasisPoints),
            this.globalConfig.platformAuthorizationRequired ? 1n : 0n,
            toByteString(workDescription),
            BigInt(workCompletionDeadline),
            BigInt(this.globalConfig.minAllowableBid),
            this.globalConfig.bountySolversNeedApproval ? 1n : 0n,
            this.globalConfig.escrowMustBeFullyDecisive ? 1n : 0n,
            this.globalConfig.furnisherBondingMode === 'forbidden'
                ? EscrowContract.FURNISHER_BONDING_MODE_FORBIDDEN : this.globalConfig.furnisherBondingMode === 'optional'
                ? EscrowContract.FURNISHER_BONDING_MODE_OPTIONAL
                : EscrowContract.FURNISHER_BONDING_MODE_REQUIRED,
            BigInt(this.globalConfig.requiredBondAmount),
            BigInt(this.globalConfig.maxWorkStartDelay),
            BigInt(this.globalConfig.maxWorkApprovalDelay),
            this.globalConfig.delayUnit === 'blocks'
                ? EscrowContract.DELAY_UNIT_BLOCKS
                : EscrowContract.DELAY_UNIT_SECONDS,
            this.globalConfig.approvalMode === 'seeker'
                ? EscrowContract.FURNISHER_APPROVAL_MODE_SEEKER : this.globalConfig.approvalMode === 'platform'
                ? EscrowContract.FURNISHER_APPROVAL_MODE_PLATFORM
                : EscrowContract.FURNISHER_APPROVAL_MODE_SEEKER_OR_PLATFORM,
            this.globalConfig.bountyIncreaseAllowanceMode === 'forbidden'
                ? EscrowContract.BOUNTY_INCREASE_FORBIDDEN : this.globalConfig.bountyIncreaseAllowanceMode === 'by-seeker'
                ? EscrowContract.BOUNTY_INCREASE_ALLOWED_BY_SEEKER : this.globalConfig.bountyIncreaseAllowanceMode === 'by-platform'
                ? EscrowContract.BOUNTY_INCREASE_ALLOWED_BY_PLATFORM : this.globalConfig.bountyIncreaseAllowanceMode === 'by-seeker-or-platform'
                ? EscrowContract.BOUNTY_INCREASE_ALLOWED_BY_SEEKER_OR_PLATFORM
                : EscrowContract.BOUNTY_INCREASE_ALLOWED_BY_ANYONE,
            this.globalConfig.bountyIncreaseCutoffPoint === 'bid-acceptance'
                ? EscrowContract.INCREASE_CUTOFF_BID_ACCEPTANCE : this.globalConfig.bountyIncreaseCutoffPoint === 'start-of-work'
                ? EscrowContract.INCREASE_CUTOFF_START_OF_WORK : this.globalConfig.bountyIncreaseCutoffPoint === 'submission-of-work'
                ? EscrowContract.INCREASE_CUTOFF_SUBMISSION_OF_WORK
                : EscrowContract.INCREASE_CUTOFF_ACCEPTANCE_OF_WORK,
            this.globalConfig.contractType === 'bid'
                ? EscrowContract.TYPE_BID
                : EscrowContract.TYPE_BOUNTY,
            this.globalConfig.contractSurvivesAdverseFurnisherDisputeResolution ? 1n : 0n
        )

        // If mode is bid, put 1 sat. Otherwise put the given amount
        // create the transaction
        const { tx } = await this.wallet.createAction({
            description: workDescription,
            outputs: [{
                outputDescription: 'Work completion contract',
                satoshis: this.globalConfig.contractType === 'bounty' ? bounty : 1,
                lockingScript: escrow.lockingScript.toHex()
            }]
        })

        // register it on the overlay
        await this.broadcaster.broadcast(Transaction.fromAtomicBEEF(tx!))
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
                protocolID: this.globalConfig.keyDerivationProtocol,
                keyID: '1'
            })
            this.derivedPublicKey = publicKey
        }
    }
}