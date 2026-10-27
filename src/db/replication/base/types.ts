import { MyDatabaseCollections } from "../../collections";

/**
 * Interface base para entidades replicáveis.
 * Toda entidade que sincroniza com Supabase DEVE ter esses campos.
 *
 * IMPORTANTE: _deleted é obrigatório para compatibilidade com RxDB WithDeleted.
 * Ao criar novos documentos, sempre defina _deleted: false.
 */
export interface ReplicableEntity {
  updated_at: number;
  created_at: number;
  _deleted: boolean;
}

/**
 * Tipo de função que resolve conflitos entre documentos local e remoto.
 * Retorna o documento que deve "vencer" o conflito.
 *
 * NOTA: Atualmente a resolução de conflitos é feita via Supabase
 * (merge-duplicates), então este tipo é usado principalmente para logging.
 */
export type ConflictResolver<T> = (localDoc: T, remoteDoc: T) => T;

/**
 * Checkpoint usado para rastrear o progresso do pull.
 * 
 * NOTA: updated_at é number (milissegundos) porque Supabase usa bigint,
 * não timestamptz. A precisão é de milissegundos em ambos os lados.
 */
export interface ReplicationCheckpoint {
  updated_at: number;
  last_id?: string | null;
}

/**
 * Configuração para criar uma replicação de entidade.
 */
export interface ReplicationConfig<T extends ReplicableEntity> {
  /**
   * Nome da coleção RxDB (key de MyDatabaseCollections)
   */
  collectionName: keyof MyDatabaseCollections;

  /**
   * Nome da tabela no Supabase
   */
  tableName: string;

  /**
   * Identificador único da replicação (usado para checkpoint persistence)
   * @default `${collectionName}-replication-v1`
   */
  replicationIdentifier?: string;

  /**
   * Tamanho do batch para pull
   * @default 1000
   */
  pullBatchSize?: number;

  /**
   * Tamanho do batch para push
   * @default 1000
   */
  pushBatchSize?: number;

  /**
   * Função que resolve conflitos entre local e remoto (para logging)
   * @default lastWriteWins
   */
  conflictResolver?: ConflictResolver<T>;

  /**
   * Função que mapeia o documento RxDB para o formato do Supabase.
   * Use para transformar/limpar campos antes de enviar.
   * Se não fornecida, envia o documento como está.
   */
  mapToSupabase?: (doc: T) => Record<string, unknown>;

  /** Prepara arquivos ou outros dados assíncronos antes de enviar ao Supabase. */
  preparePushDocument?: (
    doc: T,
    mappedDocument: Record<string, unknown>,
  ) => Promise<{ document: Record<string, unknown> }>;

  /**
   * Função que mapeia o documento do Supabase para o formato RxDB.
   * Use para transformar campos após receber.
   * Se não fornecida, usa cleanSupabaseDocument para remover nulls.
   */
  mapFromSupabase?: (doc: Record<string, unknown>) => T;

  /** Preserva campos locais ao mesclar a resposta de um push bem-sucedido. */
  mergePushResponse?: (remoteDocument: T, localDocument: T) => T;

  /**
   * Tempo em ms para retry após erro
   * @default 5000
   */
  retryTime?: number;

  /**
   * Se true, a replicação fica ativa (live) ouvindo mudanças
   * @default true
   */
  live?: boolean;

  /**
   * Se true, inicia automaticamente. Se false, precisa chamar .start()
   * @default false
   */
  autoStart?: boolean;
}
