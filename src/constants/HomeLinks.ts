import { Links } from "@/types/links.type";
import consult2 from "@/assets/btn-icons/consult.png";
import vaccine2 from "@/assets/btn-icons/vaccine.png";
import farm2 from "@/assets/btn-icons/management.png";
import weigths2 from "@/assets/btn-icons/metrics.png";
import reports2 from "@/assets/btn-icons/data.png";
import reproduction from "@/assets/btn-icons/reproductions.png";
import semen from "@/assets/btn-icons/semen.png";
import movimentacoes from "@/assets/btn-icons/movements.png";
import borns2 from "@/assets/btn-icons/borns.png";
import sales_clients from "@/assets/btn-icons/sales.png";
import rfidReader from "@/assets/btn-icons/earrings.png";
import moveCattle from "@/assets/btn-icons/move-cattle.png";


export const homeLinks: Links[] = [
  {
    id: 1,
    name: "Consulta",
    href: "/consulta",
    iconSrc: consult2,
    className: "h-12 w-12 object-cover",
    fontSize: "text-[9px]",
  },
  {
    id: 2,
    name: "Gestão animal",
    href: "/gerenciar",
    iconSrc: farm2,
    className: "h-12 w-14 object-cover",
    fontSize: "text-[9px]",
  },
  {
    id: 3,
    name: "Medidas",
    href: "/pesagem-ce",
    iconSrc: weigths2,
    className: "h-12 w-14 object-cover",
    fontSize: "text-[9px]",
  },
  {
    id: 4,
    name: "Nascimentos",
    href: "/nascimentos",
    iconSrc: borns2,
    className: "h-12 w-13 object-cover",
    fontSize: "text-[9px]",
  },
  {
    id: 5,
    name: "Vacinas",
    href: "/vacinas",
    iconSrc: vaccine2,
    className: "h-11 w-11 object-cover",
    fontSize: "text-[9px]",
  },
  {
    id: 6,
    name: "Movimentações",
    href: "/movimentacoes",
    iconSrc: movimentacoes,
    className: "h-11 w-11 object-cover",
    fontSize: "text-[8.5px]",
  },
  {
    id: 7,
    name: "Reprodução",
    href: "/reproducao",
    iconSrc: reproduction,
    className: "h-11 w-14 object-cover",
    fontSize: "text-[9px]",
  },
  {
    id: 8,
    name: "Touros / Semen",
    href: "/gerenciar/doses-semen",
    iconSrc: semen,
    className: "h-10 w-7 object-cover",
    fontSize: "text-[9px]",
  },
  {
    id: 9,
    name: "Gestão comercial",
    href: "/comercial",
    iconSrc: sales_clients,
    className: "h-10 w-12 object-cover",
    fontSize: "text-[8px]",
  },
  {
    id: 10,
    name: "Relatórios",
    href: "/geral",
    iconSrc: reports2,
    className: "h-11 w-10 object-cover",
    fontSize: "text-[9px]",
  },
  {
    id: 11,
    name: "Leitura",
    href: "/leitor-brinco",
    iconSrc: rfidReader,
    className: "h-11 w-13 object-cover",
    fontSize: "text-[9px]",
  },
  {
    id: 12,
    name: "Mover rebanho",
    href: "/mover-rebanho",
    iconSrc: moveCattle,
    className: "h-10 w-9 object-cover",
    fontSize: "text-[9px]",
  },
];
