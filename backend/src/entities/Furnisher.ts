import { WalletInterface, WalletClient, TopicBroadcaster, LookupResolver } from '@bsv/sdk'
import type { EscrowRecord } from '../constants.js'

export default class Furnisher {
    private derivedPublicKey: string | null = null

    constructor (
        private readonly wallet: WalletInterface = new WalletClient('auto', 'localhost'),
        private readonly topic: string = 'tm_escrow',
        private readonly broadcaster: TopicBroadcaster = new TopicBroadcaster([this.topic]),
        private readonly service: string = 'ls_escrow',
        private readonly resolver: LookupResolver = new LookupResolver(),
        private readonly keyDerivationProtocol = 'escrow'
    ) {
    }

    listAvailableWork() {
        // Query overlay
        // Potentially filter by work type in the future
    }

    async placeBid(record: EscrowRecord, amount: number, plans: number[], bond: number) {
        await this.populateDerivedPublicKey()
        // Verify state is initial
        // Append our bid to the lisst
        // Amount only matters when type = bid, otherwise type = bounty which is fixed.
        // Update UTXO
        // register with overlay
    }

    async startWork(record: EscrowRecord) {
        await this.populateDerivedPublicKey
        // Verify the state is accepted-bid
        // Verify the furnisher key is our key
        // Increase contract amount by required bond amount or bidded bond amount if needed
        // Register updated TX with overlay
    }

    async completeWork(record: EscrowRecord, workCompletionDescriptor: number[]) {
        // Verify the state is active-work
        // Verify the furnisher key is our key
        // State goes to submitted-work
        // Add the work completion descriptor
        // Optionally, snnd a message to the seeker notifying them
        // Update the UTXO on the overlay
    }

    async claimBounty (entity: EscrowRecord) {
         // Verify the state is resolved
        // Verify the furnisher key is our key
        // spend the UTXO into our balance
    }

    async raiseDispute(record: EscrowRecord) {
        // Verify state is submitted-work with our key
        // Verify seeker payout approval time has elapsed
        // State goes to furnisher-dispute
        // Update UTXO on overlay
    }

    listDisputes(active?: boolean) {
        // true = only active
        // false = only historical
        // undefined = both
        // Active disputes are still on the overlay
        // Records of past disputes are stored in local baskets
    }

    async claimAfterDispute(record: EscrowRecord) {
        // List messages in disputes message box
        // Internalize any payouts to the wallet
        // Make record of a dispute by keeping a new PushDrop in a basket
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