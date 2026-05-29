export interface ResumeTextChunk {
  text: string;
  hadBullet: boolean;
}

interface SplitResumeTextChunkOptions {
  splitSentences?: boolean;
}

const BULLET_PREFIX_RE = /^\s*(?:[•*-]|\d+[.)])\s+/;
const SENTENCE_RE = /[^.!?]+[.!?]+(?:\s+|$)|[^.!?]+$/g;

export const stripBulletPrefix = (value: string) => value.replace(BULLET_PREFIX_RE, '').trim();

export const splitResumeTextChunks = (value: string, options: SplitResumeTextChunkOptions = {}): ResumeTextChunk[] => {
  const normalized = (value || '')
    .replace(/\r\n/g, '\n')
    .replace(/([.!?])\s*[-•*]\s+/g, '$1\n- ')
    .replace(/([a-z0-9)])\s*[-•*]\s+(?=[A-Z])/g, '$1\n- ')
    .trim();
  if (!normalized) return [{ text: '', hadBullet: true }];

  const lines = normalized
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);

  if (lines.length > 1) {
    return lines.map((line) => ({
      text: stripBulletPrefix(line),
      hadBullet: BULLET_PREFIX_RE.test(line),
    }));
  }

  const bulletMatches = normalized.match(/(?:^|\s)[•*-]\s+[^•*-]+(?=(?:\s+[•*-]\s+)|$)/g);
  if (bulletMatches && bulletMatches.length > 1) {
    return bulletMatches.map((chunk) => ({
      text: stripBulletPrefix(chunk),
      hadBullet: true,
    }));
  }

  const sentences = normalized.match(SENTENCE_RE)?.map((sentence) => sentence.trim()).filter(Boolean) || [];
  if ((options.splitSentences || normalized.length > 220) && sentences.length > 1) {
    return sentences.map((sentence) => ({
      text: stripBulletPrefix(sentence),
      hadBullet: false,
    }));
  }

  return [{
    text: stripBulletPrefix(normalized),
    hadBullet: BULLET_PREFIX_RE.test(normalized),
  }];
};

export const joinResumeTextChunks = (chunks: ResumeTextChunk[], options: { forceBullets?: boolean; separator?: string } = {}) => {
  const forceBullets = options.forceBullets ?? false;
  const separator = options.separator ?? '\n';
  return chunks
    .map((chunk) => chunk.text.trim())
    .filter(Boolean)
    .map((text) => (forceBullets ? `• ${text}` : text))
    .join(separator);
};

export const getChunkFieldId = (fieldId: string, chunkIndex: number) => `${fieldId}.chunk.${chunkIndex}`;

export const getCanvasChunkFieldId = (fieldId: string, chunkIndex: number) => `${fieldId}#chunk-${chunkIndex}`;

export const resolveChunkFieldId = (fieldId: string) => {
  const chunkMatch = fieldId.match(/^(.*)#chunk-(\d+)$/);
  const formChunkMatch = fieldId.match(/^(.*)\.chunk\.(\d+)$/);

  if (formChunkMatch) {
    return {
      baseFieldId: formChunkMatch[1],
      formFieldId: fieldId,
    };
  }

  if (!chunkMatch) {
    return { baseFieldId: fieldId, formFieldId: fieldId };
  }

  return {
    baseFieldId: chunkMatch[1],
    formFieldId: getChunkFieldId(chunkMatch[1], Number(chunkMatch[2])),
  };
};
