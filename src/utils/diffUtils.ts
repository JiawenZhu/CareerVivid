export interface DiffToken {
  type: 'added' | 'removed' | 'equal';
  value: string;
}

/**
 * Computes word-level differences between two strings using dynamic programming (LCS).
 * Preserves whitespaces so that the reconstructed string is formatted nicely.
 */
export function diffWords(oldStr: string, newStr: string): DiffToken[] {
  const oldText = oldStr || '';
  const newText = newStr || '';

  // Split by words but preserve all whitespaces so they can be rejoined perfectly.
  const tokenize = (str: string) => {
    return str.split(/(\s+)/).filter(Boolean);
  };

  const a = tokenize(oldText);
  const b = tokenize(newText);

  const n = a.length;
  const m = b.length;

  // DP table for LCS length
  const dp: number[][] = Array.from({ length: n + 1 }, () => Array(m + 1).fill(0));

  for (let i = 1; i <= n; i++) {
    for (let j = 1; j <= m; j++) {
      if (a[i - 1] === b[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1] + 1;
      } else {
        dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]);
      }
    }
  }

  // Backtrack to assemble diff tokens
  const result: DiffToken[] = [];
  let i = n;
  let j = m;

  while (i > 0 || j > 0) {
    if (i > 0 && j > 0 && a[i - 1] === b[j - 1]) {
      result.unshift({ type: 'equal', value: a[i - 1] });
      i--;
      j--;
    } else if (j > 0 && (i === 0 || dp[i][j - 1] >= dp[i - 1][j])) {
      result.unshift({ type: 'added', value: b[j - 1] });
      j--;
    } else {
      result.unshift({ type: 'removed', value: a[i - 1] });
      i--;
    }
  }

  // Combine contiguous tokens of the same type to simplify rendering structure
  const combined: DiffToken[] = [];
  for (const token of result) {
    const last = combined[combined.length - 1];
    if (last && last.type === token.type) {
      last.value += token.value;
    } else {
      combined.push({ ...token });
    }
  }

  return combined;
}
