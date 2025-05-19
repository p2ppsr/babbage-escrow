import { Collection, Db } from 'mongodb'
import { EscrowRecord, UTXOReference } from '../constants.js'

// Implements a Lookup StorageEngine for Meter
export class EscrowStorage {
  private readonly records: Collection<EscrowRecord>

  /**
   * Constructs a new MeterStorageEngine instance
   * @param {Db} db - connected mongo database instance
   */
  constructor(private readonly db: Db) {
    this.records = db.collection<EscrowRecord>('EscrowRecords')
  }

  /**
   * Stores escrow record
   * @param {string} txid transaction id
   * @param {number} outputIndex index of the UTXO
   * @param {string} value - meter value to save
   */
  async storeRecord(record: EscrowRecord): Promise<void> {
    await this.records.insertOne(record)
  }

  /**
   * Delete a matching Escrow record
   * @param {string} txid transaction id
   * @param {number} outputIndex Output index of the UTXO
   */
  async deleteRecord(txid: string, outputIndex: number): Promise<void> {
    await this.records.deleteOne({ txid, outputIndex })
  }

  /**
   * Returns all results tracked by the overlay
   * @returns {Promise<UTXOReference[]>} returns matching UTXO references
   */
  async findAll(): Promise<UTXOReference[]> {
    return await this.records.find({})
      .project<UTXOReference>({ txid: 1, outputIndex: 1 })
      .toArray()
      .then(results => results.map(record => ({
        txid: record.txid,
        outputIndex: record.outputIndex
      })))
  }
}
