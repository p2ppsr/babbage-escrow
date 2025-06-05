import { WalletInterface, WalletClient, TopicBroadcaster, LookupResolver, Broadcaster, Signature, TransactionSignature, Utils, Transaction } from '@bsv/sdk'
import type { EscrowTX, GlobalConfig } from '../constants.js'
import { recordsFromAnswer, callContractMethod } from '../utils.js'
import { PubKey, Sig, toByteString } from 'scrypt-ts'
import { Bid } from 'src/contracts/Escrow.js'

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

    async placeBid(escrow: EscrowTX, amount: number, plans: string, timeRequired: number, bond: number) {
        await this.populateDerivedPublicKey()
        const bid: Bid = {
            furnisherKey: PubKey(this.derivedPublicKey!),
            plans: toByteString(plans, true),
            bidAmount: BigInt(amount),
            bond: BigInt(bond),
            timeRequired: BigInt(timeRequired),
            timeOfBid: BigInt(await this.getCurrentLockTime())
        }
        const { tx } = await callContractMethod(
            this.wallet,
            escrow,
            'furnisherPlacesBid',
            [this.signatory(), bid, escrow.contract.bids.findIndex(x => x.furnisherKey === escrow.contract.seekerKey)],
            escrow.satoshis
        )
        await this.broadcaster.broadcast(Transaction.fromAtomicBEEF(tx!))
    }

    async startWork(escrow: EscrowTX) {
        await this.populateDerivedPublicKey()
        const { tx } = await callContractMethod(
            this.wallet,
            escrow,
            'furnisherStartsWork',
            [this.signatory()],
            escrow.satoshis + Number(escrow.contract.acceptedBid.bond)
        )
        await this.broadcaster.broadcast(Transaction.fromAtomicBEEF(tx!))
    }

    async completeWork(escrow: EscrowTX, workCompletionDescriptor: string) {
        await this.populateDerivedPublicKey()
        const { tx } = await callContractMethod(
            this.wallet,
            escrow,
            'furnisherSubmitsWork',
            [this.signatory(), toByteString(workCompletionDescriptor)],
            escrow.satoshis
        )
        await this.broadcaster.broadcast(Transaction.fromAtomicBEEF(tx!))
    }

    async claimBounty (escrow: EscrowTX) {
        await this.populateDerivedPublicKey()
        const { tx } = await callContractMethod(
            this.wallet,
            escrow,
            'furnisherClaimsPayment',
            [this.signatory()]
        )
        await this.broadcaster.broadcast(Transaction.fromAtomicBEEF(tx!))
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

    private signatory() {
        return async (preimageHash: number[], scope: number): Promise<Sig> => {
            const { signature } = await this.wallet.createSignature({
                protocolID: this.globalConfig.keyDerivationProtocol,
                keyID: '1',
                counterparty: 'self',
                data: preimageHash
            })
            const rawSignature = Signature.fromDER(signature)
            const txSig = new TransactionSignature(rawSignature.r, rawSignature.s, scope)
            return Sig(toByteString(Utils.toHex(txSig.toChecksigFormat())))
        }
    }

    async getCurrentLockTime(): Promise<number> {
        if (this.globalConfig.delayUnit === 'blocks') {
            const { height } = await this.wallet.getHeight({})
            return height
        } else {
            return Math.floor(Date.now() / 1000)
        }
    }
}