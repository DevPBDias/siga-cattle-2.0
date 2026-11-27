// Re-export base utilities
export * from "./base";

// Re-export entity replications (novo template)
export { animalReplication, replicateAnimalsNew } from "./animal.replication";
export {
  semenDoseReplication,
  replicateSemenDosesNew,
} from "./semenDose.replication";
export { farmReplication, replicateFarmsNew } from "./farm.replication";
export { userProfileReplication, replicateUserProfilesNew } from "./userProfile.replication";
export {
  vaccineReplication,
  replicateVaccinesNew,
} from "./vaccine.replication";
export {
  animalVaccineReplication,
  replicateAnimalVaccinesNew,
} from "./animalVaccine.replication";
export {
  animalMetricWeightReplication,
  replicateAnimalMetricWeightNew,
  animalMetricCEReplication,
  replicateAnimalMetricCENew,
} from "./metric.replication";
export {
  reproductionEventReplication,
  replicateReproductionEventsNew,
} from "./reproduction.replication";
export {
  animalSituationReplication,
  replicateAnimalSituationsNew,
} from "./situation.replication";
export {
  animalPartnershipReplication,
  replicateAnimalPartnershipsNew,
} from "./partnership.replication";
export {
  transactionReplication,
  replicateTransactionsNew,
} from "./transaction.replication";
export { clientReplication, replicateClientsNew } from "./client.replication";
export {
  movementReplication,
  replicateMovementsNew,
} from "./movement.replication";
export { deathReplication, replicateDeathsNew } from "./death.replication";
export {
  exchangeReplication,
  replicateExchangesNew,
} from "./exchange.replication";
