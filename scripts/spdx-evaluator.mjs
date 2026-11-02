export const ALLOWED_LICENSES = new Set([
  'MIT',
  'MIT-0',
  'Apache-2.0',
  'BSD-2-Clause',
  'BSD-3-Clause',
  'ISC',
  '0BSD',
  'CC0-1.0',
  'CC-BY-4.0',
  'Python-2.0',
  'Unlicense',
  'BlueOak-1.0.0',
]);

export const PROHIBITED_SUBSTRINGS = ['GPL', 'AGPL', 'SSPL', 'Commons Clause', 'CC-BY-NC', 'Proprietary', 'UNKNOWN'];

export const PERMISSIBLE_EXCEPTIONS = new Set([
  'LLVM-exception',
  'Classpath-exception-2.0',
  'Universal-FOSS-exception-1.0',
]);

/**
 * Tokenize an SPDX license string into individual tokens.
 */
export function tokenizeSpdx(input) {
  if (!input || typeof input !== 'string') return [];
  const trimmed = input.trim();
  if (!trimmed) return [];
  const regex = /\(|\)|[^\s()]+/g;
  const tokens = [];
  let match;
  while ((match = regex.exec(trimmed)) !== null) {
    tokens.push(match[0]);
  }
  return tokens;
}

/**
 * Strict EBNF recursive descent parser for SPDX 2.x/3.x expressions.
 * Grammar:
 *   Expression   := OrExpression EOF ;
 *   OrExpression := AndExpression ( "OR" AndExpression )* ;
 *   AndExpression:= PrimaryExpression ( "AND" PrimaryExpression )* ;
 *   PrimaryExpression := "(" Expression ")"
 *                      | Identifier ( "WITH" ExceptionIdentifier )? ;
 */
export function parseSpdx(tokens) {
  let index = 0;

  function peek() {
    return tokens[index];
  }

  function consume(expected) {
    if (index >= tokens.length) {
      throw new Error(`Unexpected end of input, expected ${expected || 'token'}`);
    }
    const token = tokens[index++];
    if (expected && token.toUpperCase() !== expected.toUpperCase()) {
      throw new Error(`Expected token ${expected}, got ${token}`);
    }
    return token;
  }

  function parseExpression() {
    return parseOr();
  }

  function parseOr() {
    let left = parseAnd();
    while (index < tokens.length && peek()?.toUpperCase() === 'OR') {
      consume('OR');
      if (index >= tokens.length) {
        throw new Error('Missing right operand after OR');
      }
      const right = parseAnd();
      left = { type: 'OR', left, right };
    }
    return left;
  }

  function parseAnd() {
    let left = parsePrimary();
    while (index < tokens.length && peek()?.toUpperCase() === 'AND') {
      consume('AND');
      if (index >= tokens.length) {
        throw new Error('Missing right operand after AND');
      }
      const right = parsePrimary();
      left = { type: 'AND', left, right };
    }
    return left;
  }

  function parsePrimary() {
    if (index >= tokens.length) {
      throw new Error('Unexpected end of input, expected expression');
    }
    const current = peek();

    if (current === '(') {
      consume('(');
      const expr = parseExpression();
      if (index >= tokens.length || peek() !== ')') {
        throw new Error('Unclosed parenthesis');
      }
      consume(')');
      return expr;
    }

    if (current === ')') {
      throw new Error('Unexpected closing parenthesis');
    }

    if (current.toUpperCase() === 'OR' || current.toUpperCase() === 'AND' || current.toUpperCase() === 'WITH') {
      throw new Error(`Unexpected keyword operand: ${current}`);
    }

    // License identifier
    const license = consume();
    if (!/^[a-zA-Z0-9.\-_+]+$/.test(license)) {
      throw new Error(`Invalid characters in license identifier: ${license}`);
    }

    let exception = null;
    if (index < tokens.length && peek()?.toUpperCase() === 'WITH') {
      consume('WITH');
      if (index >= tokens.length) {
        throw new Error('Missing exception identifier after WITH');
      }
      const nextToken = peek();
      if (nextToken === '(' || nextToken === ')' || nextToken.toUpperCase() === 'OR' || nextToken.toUpperCase() === 'AND' || nextToken.toUpperCase() === 'WITH') {
        throw new Error(`Unexpected token following WITH: ${nextToken}`);
      }
      exception = consume();
      if (!/^[a-zA-Z0-9.\-_+]+$/.test(exception)) {
        throw new Error(`Invalid characters in exception identifier: ${exception}`);
      }
    }

    return { type: 'ATOM', license, exception };
  }

  if (!tokens || tokens.length === 0) {
    throw new Error('Empty SPDX expression');
  }

  const root = parseExpression();
  if (index < tokens.length) {
    throw new Error(`Unexpected trailing tokens: ${tokens.slice(index).join(' ')}`);
  }
  return root;
}

/**
 * Evaluates whether an AST is compliant under the allowed license set and prohibited substrings.
 */
export function evaluateAst(node, allowedLicenses = ALLOWED_LICENSES, prohibited = PROHIBITED_SUBSTRINGS) {
  if (!node) return false;

  if (node.type === 'OR') {
    return evaluateAst(node.left, allowedLicenses, prohibited) || evaluateAst(node.right, allowedLicenses, prohibited);
  }

  if (node.type === 'AND') {
    return evaluateAst(node.left, allowedLicenses, prohibited) && evaluateAst(node.right, allowedLicenses, prohibited);
  }

  if (node.type === 'ATOM') {
    const lic = node.license;
    if (!lic || lic === 'UNKNOWN') return false;

    // Check prohibited substrings
    for (const p of prohibited) {
      if (lic.includes(p)) return false;
    }

    // Check license allowlist
    if (!allowedLicenses.has(lic)) return false;

    // Check exception allowlist if present
    if (node.exception && !PERMISSIBLE_EXCEPTIONS.has(node.exception)) {
      return false;
    }

    return true;
  }

  return false;
}

/**
 * Top-level fail-closed evaluator for an SPDX license expression string.
 */
export function isSpdxCompliant(expression, options = {}) {
  const allowed = options.allowedLicenses || ALLOWED_LICENSES;
  const prohibited = options.prohibitedSubstrings || PROHIBITED_SUBSTRINGS;

  try {
    const tokens = tokenizeSpdx(expression);
    if (tokens.length === 0) return false;
    const ast = parseSpdx(tokens);
    return evaluateAst(ast, allowed, prohibited);
  } catch {
    return false;
  }
}
