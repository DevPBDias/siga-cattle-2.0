import { TableColumn } from "../types";

export const MAX_SELECTABLE_COLUMNS = 10;

export const ANIMAL_REPORT_AVAILABLE_COLUMNS: TableColumn[] = [
  { header: "FAZENDA", dataKey: "farmName" },
  { header: "SEXO", dataKey: "sex" },
  { header: "STATUS", dataKey: "status" },
  { header: "NASCIMENTO", dataKey: "birthDate" },
  { header: "IDADE", dataKey: "age" },
  { header: "PAI (RGD)", dataKey: "fatherRgd" },
  { header: "MÃE (RGD)", dataKey: "motherRgd" },
  { header: "iABCGz", dataKey: "iabcgz" },
  { header: "DECA", dataKey: "deca" },
  { header: "AVÔ MATERNO", dataKey: "maternal_grandfather_name" },
  { header: "AVÔ PATERNO", dataKey: "paternal_grandfather_name" },
  { header: "P%", dataKey: "p" },
  { header: "F%", dataKey: "f" },
  { header: "CLASSE", dataKey: "classification" },
  { header: "SOCIEDADE", dataKey: "society" },
  { header: "CATEGORIA", dataKey: "category" },
  { header: "GENOTIPAGEM", dataKey: "genotype" },
  { header: "SITUAÇÃO", dataKey: "document_situation" },
  { header: "ATIVIDADE", dataKey: "animalState" },
];

export const DEFAULT_SELECTED_COLUMNS: TableColumn[] = [
  { header: "NASCIMENTO", dataKey: "birthDate" },
  { header: "CLASSE", dataKey: "classification" },
  { header: "STATUS", dataKey: "status" },
];

export const REPRODUCTION_REPORT_AVAILABLE_COLUMNS: TableColumn[] = [
  { header: "NOME", dataKey: "animalName" },
  { header: "MANEJO", dataKey: "managementType" },
  { header: "TIPO DE EVENTO", dataKey: "event_type" },
  { header: "STATUS PRODUTIVO", dataKey: "productive_status" },
  { header: "DATA D10", dataKey: "date" },
  { header: "ECC", dataKey: "body_score" },
  { header: "CICLO", dataKey: "cycle_stage" },
  { header: "TAM. OVÁRIO", dataKey: "ovary_size" },
  { header: "ESTRUT. OVÁRIO", dataKey: "ovary_structure" },
  { header: "PROTOCOLO", dataKey: "protocol_name" },
  { header: "TOURO (IA)", dataKey: "bull_name" },
  { header: "TOURO (RESYNC)", dataKey: "resync_bull" },
  { header: "TOURO (MONTA)", dataKey: "natural_mating_bull" },
  { header: "DG30", dataKey: "diagnostic_d30" },
  { header: "DG FINAL", dataKey: "final_diagnostic" },
];

export const REPRODUCTION_DEFAULT_COLUMNS: TableColumn[] = [
  { header: "NOME", dataKey: "animalName" },
  { header: "MANEJO", dataKey: "managementType" },
  { header: "DATA D10", dataKey: "date" },
  { header: "DG FINAL", dataKey: "final_diagnostic" },
];
