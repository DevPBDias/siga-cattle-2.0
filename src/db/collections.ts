import { RxCollection, RxDatabase } from "rxdb";

import { RxReplicationState } from "rxdb/plugins/replication";
import { AnimalMetric } from "@/types/animal_metrics.type";
import { Animal } from "@/types/animal.type";
import { AnimalVaccine, Vaccine } from "@/types/vaccine.type";
import { Farm } from "@/types/farm.type";
import { ReproductionEvent } from "@/types/reproduction_event.type";
import { AnimalSituation } from "@/types/situation.type";
import { AnimalPartnership } from "@/types/partnership.type";
import { SemenDose } from "@/types/semen_dose.type";
import { Client } from "@/types/client.type";
import { Transaction } from "@/types/transaction.type";
import { Death } from "@/types/death.type";
import { Exchange } from "@/types/exchange.type";
import { UserProfile } from "@/types/user_profile.type";
import { WeaningRecord } from "@/types/weaning_record.type";

import { Movement } from "@/types/movement.type";

export type AnimalCollection = RxCollection<Animal>;
export type VaccineCollection = RxCollection<Vaccine>;
export type FarmCollection = RxCollection<Farm>;
export type AnimalMetricWeightCollection = RxCollection<AnimalMetric>;
export type AnimalVaccineCollection = RxCollection<AnimalVaccine>;
export type ReproductionCollection = RxCollection<ReproductionEvent>;
export type AnimalSituationCollection = RxCollection<AnimalSituation>;
export type AnimalPartnershipCollection = RxCollection<AnimalPartnership>;
export type SemenDoseCollection = RxCollection<SemenDose>;
export type ClientCollection = RxCollection<Client>;
export type MovementCollection = RxCollection<Movement>;
export type TransactionCollection = RxCollection<Transaction>;
export type DeathCollection = RxCollection<Death>;
export type ExchangeCollection = RxCollection<Exchange>;
export type UserProfileCollection = RxCollection<UserProfile>;
export type WeaningRecordCollection = RxCollection<WeaningRecord>;

export type MyDatabaseCollections = {
  animals: AnimalCollection;
  vaccines: VaccineCollection;
  farms: FarmCollection;
  user_profiles: UserProfileCollection;
  animal_metrics_weight: AnimalMetricWeightCollection;
  animal_vaccines: AnimalVaccineCollection;
  reproduction_events: ReproductionCollection;
  animal_situations: AnimalSituationCollection;
  animal_partnerships: AnimalPartnershipCollection;
  semen_doses: SemenDoseCollection;
  clients: ClientCollection;
  movements: MovementCollection;
  transactions: TransactionCollection;
  deaths: DeathCollection;
  exchanges: ExchangeCollection;
  weaning_records: WeaningRecordCollection;
};

export type MyDatabase = RxDatabase<MyDatabaseCollections> & {
  replications?: {
    animals: RxReplicationState<Animal, any>;
    vaccines: RxReplicationState<Vaccine, any>;
    farms: RxReplicationState<Farm, any>;
    user_profiles: RxReplicationState<UserProfile, any>;
    animal_metrics_weight: RxReplicationState<AnimalMetric, any>;
    animal_vaccines: RxReplicationState<AnimalVaccine, any>;
    reproduction_events: RxReplicationState<ReproductionEvent, any>;
    animal_situations: RxReplicationState<AnimalSituation, any>;
    animal_partnerships: RxReplicationState<AnimalPartnership, any>;
    semen_doses: RxReplicationState<SemenDose, any>;
    clients: RxReplicationState<Client, any>;
    movements: RxReplicationState<Movement, any>;
    transactions: RxReplicationState<Transaction, any>;
    deaths: RxReplicationState<Death, any>;
    exchanges: RxReplicationState<Exchange, any>;
    weaning_records: RxReplicationState<WeaningRecord, any>;
  };
};
