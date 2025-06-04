import { WalletInterface, WalletClient, TopicBroadcaster, LookupResolver, Broadcaster } from '@bsv/sdk'
import type { EscrowTX, GlobalConfig } from '../constants.js'
import { recordsFromAnswer } from '../utils.js'

export default class Furnisher {
    private derivedPublicKey: string | null = null
    private broadcaster: Broadcaster
    private resolver: LookupResolver

    constructor (
        private readonly globalConfig: GlobalConfig,
        private readonly wallet: WalletInterface = new WalletClient('auto', 'localhost'),
        broadcaster: TopicBroadcaster | 'DEFAULT' = 'DEFAULT',
        resolver: LookupResolver | 'DEFAULT' = 'DEFAULT',
    ) {
        if (broadcaster === 'DEFAULT') {
            this.broadcaster = new TopicBroadcaster([globalConfig.topic], {
                networkPreset: globalConfig.networkPreset
            })
        } else {
            this.broadcaster = broadcaster
        }
        if (resolver === 'DEFAULT') {
            this.resolver = new LookupResolver({
                networkPreset: globalConfig.networkPreset
            })
        } else {
            this.resolver = resolver
        }
    }

    async listAvailableWork() {
        await this.populateDerivedPublicKey()
        const answer = await this.resolver.query({
            service: this.globalConfig.service,
            query: {
                globalConfig: this.globalConfig,

                find: 'all-open'
            }
        })
        return recordsFromAnswer(answer)
        // Potentially filter by work type in the future
    }

    async placeBid(record: EscrowTX, amount: number, plans: number[], bond: number) {
        await this.populateDerivedPublicKey()
        // Verify state is initial
        // Append our bid to the lisst
        // Amount only matters when type = bid, otherwise type = bounty which is fixed.
        // Update UTXO
        // register with overlay
    }

    async startWork(record: EscrowTX) {
        await this.populateDerivedPublicKey
        // Verify the state is accepted-bid
        // Verify the furnisher key is our key
        // Increase contract amount by required bond amount or bidded bond amount if needed
        // Register updated TX with overlay
    }

    async completeWork(record: EscrowTX, workCompletionDescriptor: number[]) {
        // Verify the state is active-work
        // Verify the furnisher key is our key
        // State goes to submitted-work
        // Add the work completion descriptor
        // Optionally, snnd a message to the seeker notifying them
        // Update the UTXO on the overlay
    }

    async claimBounty (entity: EscrowTX) {
         // Verify the state is resolved
        // Verify the furnisher key is our key
        // spend the UTXO into our balance
    }

    async raiseDispute(record: EscrowTX) {
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

    async claimAfterDispute(record: EscrowTX) {
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