/**
 * Fixtures padrão de domínio zootécnico e comercial para testes do INDI Ouro 2.0.
 */

export const mockAnimalList = [
  {
    id: "animal-1",
    rgn: "1001",
    name: "INDI 1001",
    gender: "Macho",
    sex: "M",
    category: "Touro",
    breed: "Nelore",
    birth_date: "2023-01-15",
    paddock: "Pasto 01",
    paddock_id: "paddock-1",
    weight: 620,
    ce: 38,
    status: "Ativo",
    iabcgz: "12.45",
    deca: "1",
    _deleted: false,
    created_at: 1704067200000,
    updated_at: 1704067200000,
  },
  {
    id: "animal-2",
    rgn: "1002",
    name: "INDI 1002",
    gender: "Fêmea",
    sex: "F",
    category: "Matriz",
    breed: "Nelore",
    birth_date: "2022-05-20",
    paddock: "Maternidade",
    paddock_id: "paddock-2",
    weight: 510,
    status: "Prenhe",
    reproduction_status: "Prenhe",
    iabcgz: "15.80",
    deca: "1",
    _deleted: false,
    created_at: 1704067200000,
    updated_at: 1704067200000,
  },
  {
    id: "animal-3",
    rgn: "1003",
    name: "INDI 1003",
    gender: "Macho",
    sex: "M",
    category: "Bezerro",
    breed: "Nelore Mocho",
    birth_date: "2024-08-10",
    paddock: "Pasto Bezerros",
    paddock_id: "paddock-3",
    weight: 180,
    status: "Ativo",
    _deleted: false,
    created_at: 1704067200000,
    updated_at: 1704067200000,
  },
];

export const mockClientList = [
  {
    id: "client-1",
    name: "Abelardo Bezerra Neto",
    cpf_cnpj: "123.456.789-00",
    phone: "(11) 98765-4321",
    farm: "Fazenda Esperança",
    city: "São Paulo",
    _deleted: false,
    created_at: 1704067200000,
    updated_at: 1704067200000,
  },
  {
    id: "client-2",
    name: "Agropecuária Vale Verde",
    cpf_cnpj: "12.345.678/0001-90",
    phone: "(67) 99988-7766",
    farm: "Fazenda Modelo",
    city: "Campo Grande",
    _deleted: false,
    created_at: 1704067200000,
    updated_at: 1704067200000,
  },
];

export const mockSalesList = [
  {
    id: "sale-1",
    animal_rgn: "1001",
    client_id: "client-1",
    date: "2026-03-05",
    total_value: 15000,
    payment_method: "Boleto",
    down_payment: 5000,
    installments: "2",
    installment_value: 5000,
    gta_number: "31149 H",
    financial_status: "Pendente",
    _deleted: false,
    created_at: 1704067200000,
    updated_at: 1704067200000,
  },
];

export const mockSemenDoses = [
  {
    id: "semen-1",
    bull_rgn: "TOURO 999",
    bull_name: "REM ARMADOR",
    breed: "Nelore",
    available_doses: 45,
    storage_tank: "Botijão 01",
    canister: "Caneca 03",
    _deleted: false,
    created_at: 1704067200000,
    updated_at: 1704067200000,
  },
];

export const mockVaccinesList = [
  {
    id: "vac-1",
    name: "Aftosa",
    type: "Vacina",
    required_frequency_months: 6,
    last_applied_date: "2026-01-10",
    next_application_date: "2026-07-10",
    target_category: "Todos",
    _deleted: false,
    created_at: 1704067200000,
    updated_at: 1704067200000,
  },
];

