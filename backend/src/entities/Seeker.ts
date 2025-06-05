import { WalletInterface, WalletClient, TopicBroadcaster, LookupResolver, Transaction, TransactionSignature, Signature, Utils, Broadcaster } from '@bsv/sdk'
import type { EscrowTX,  GlobalConfig } from '../constants.js'
import { callContractMethod, contractFromGlobalConfigAndParams, recordsFromAnswer } from '../utils.js'
import { bsv, PubKey, Sig, toByteString } from 'scrypt-ts'
import { EscrowContract } from '../contracts/Escrow.js'
import escrowArtifact from '../../artifacts/Escrow.json' with { type: 'json' }
EscrowContract.loadArtifact(escrowArtifact)

export default class Seeker {
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

    async seek (
        workDescription: string,
        workCompletionDeadline: number,
        bounty: number = 1
    ): Promise<void> {
        await this.populateDerivedPublicKey()
        const escrow = contractFromGlobalConfigAndParams(
            this.globalConfig,
            this.derivedPublicKey as string,
            workDescription,
            workCompletionDeadline
        )
        const { tx } = await this.wallet.createAction({
            description: workDescription,
            outputs: [{
                outputDescription: 'Work completion contract',
                satoshis: this.globalConfig.contractType === 'bounty' ? bounty : 1,
                lockingScript: escrow.lockingScript.toHex()
            }]
        })
        await this.broadcaster.broadcast(Transaction.fromAtomicBEEF(tx!))
    }

    async getMyOpenContracts(): Promise<Array<EscrowTX>> {
        await this.populateDerivedPublicKey()
        const answer = await this.resolver.query({
            service: this.globalConfig.service,
            query: {
                globalConfig: this.globalConfig,
                seekerKey: this.derivedPublicKey,
                find: 'all-open'
            }
        })
        return recordsFromAnswer(answer)
    }

    async cancelBeforeAccept(escrow: EscrowTX): Promise<void> {
        const { tx } = await callContractMethod(
            this.wallet,
            escrow,
            'seekerCancelsBeforeAccept',
            [this.signatory()]
        )
        await this.broadcaster.broadcast(Transaction.fromAtomicBEEF(tx!))
    }

    async increaseBounty(escrow: EscrowTX, increaseBy: number) {
        const { tx } = await callContractMethod(
            this.wallet,
            escrow,
            'increaseBounty',
            [EscrowContract.BOUNTY_INCREASE_ALLOWED_BY_SEEKER, BigInt(increaseBy), this.signatory()],
            escrow.satoshis = increaseBy
        )
        await this.broadcaster.broadcast(Transaction.fromAtomicBEEF(tx!))
    }

    async acceptBid(escrow: EscrowTX, bidIndex: number) {
        const { tx } = await callContractMethod(
            this.wallet,
            escrow,
            'acceptBid',
            [EscrowContract.BID_ACCEPTED_BY_SEEKER, this.signatory(), BigInt(bidIndex)],
            escrow.contract.contractType === EscrowContract.TYPE_BID
                ? Number(escrow.contract.bids[bidIndex].bidAmount)
                : escrow.satoshis
        )
        await this.broadcaster.broadcast(Transaction.fromAtomicBEEF(tx!))
    }

    async cancelBidApprovalAfterDelay(escrow: EscrowTX) {
        const lockTime = await this.getCurrentLockTime()
        const { tx } = await callContractMethod(
            this.wallet,
            escrow,
            'withdrawBidAcceptance',
            [
                this.signatory(),
                escrow.contract.bids.findIndex(x => (
                    x.furnisherKey === escrow.contract.acceptedBid.furnisherKey && x.plans === escrow.contract.acceptedBid.plans
                ))
            ],
            escrow.contract.contractType === EscrowContract.TYPE_BID ? 1 : escrow.satoshis,
            [],
            0xffffffe,
            lockTime
        )
        await this.broadcaster.broadcast(Transaction.fromAtomicBEEF(tx!))
    }

    async approveCompletedWork(escrow: EscrowTX) {
        const { tx } = await callContractMethod(
            this.wallet,
            escrow,
            'seekerApprovesWork',
            [this.signatory()],
            escrow.satoshis
        )
        await this.broadcaster.broadcast(Transaction.fromAtomicBEEF(tx!))
    }

    async disputeWork(record: EscrowTX, evidence?: number[]) {
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

    async reclaimAfterDispute(record: EscrowTX, reconstitute?: boolean) {
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
