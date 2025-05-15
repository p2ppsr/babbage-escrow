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

    listActiveDisputes() {
        // Query overlay where we are the platform key
        // Hydrate with messages from parties
    }

    listHistoricalDisputes() {
        // Return the local, historical recordkeeping UTXOs from the decisions basket
    }

    async decideDispute(record: EscrowRecord, amountForSeeker: number, amountForFurnisher: number, notes: number[]) {
        // Verify platform key matches and state id seeker-dispute or furnisherid-spute
        // Contract is destroyed (no new state propagating forward anymore)
        // New UTXOs created according to the outcome
        // Contract rules still enforce constraints: provider fee is limited, only certain outcomes possible.
        // Save a PushDrop recordkeeping UTXO in a decisions basket for reference
        // Messages sent from platform to both parties containing either a denial or the payout TX
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