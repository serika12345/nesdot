const normalizeLicenseExpression = (licenseExpression) => {
  return licenseExpression.replace(/\s*\/\s*/gu, " OR ").trim();
};

const tokenizeLicenseExpression = (licenseExpression) => {
  return normalizeLicenseExpression(licenseExpression)
    .split(/(\bAND\b|\bOR\b|[()])/u)
    .map((token) => token.trim())
    .filter((token) => token.length > 0);
};

const isGplFamilyLicense = (licenseIdentifier) => {
  const normalizedLicenseIdentifier = licenseIdentifier.toUpperCase();

  return (
    normalizedLicenseIdentifier.includes("GPL") ||
    normalizedLicenseIdentifier.includes("GENERAL PUBLIC LICENSE")
  );
};

const parsePrimaryExpression = (tokens, startIndex) => {
  const token = tokens[startIndex];

  if (token === undefined) {
    throw new Error("Unexpected end of license expression.");
  }

  if (token === "(") {
    const nestedExpressionResult = parseOrExpression(tokens, startIndex + 1);
    const closingToken = tokens[nestedExpressionResult.nextIndex];

    if (closingToken !== ")") {
      throw new Error("Unexpected end of license expression.");
    }

    return {
      nextIndex: nestedExpressionResult.nextIndex + 1,
      node: nestedExpressionResult.node,
    };
  }

  if (token === "AND" || token === "OR" || token === ")") {
    throw new Error(`Unexpected token in license expression: ${token}`);
  }

  return {
    nextIndex: startIndex + 1,
    node: {
      type: "license",
      value: token,
    },
  };
};

const parseAndExpression = (tokens, startIndex) => {
  const leftExpressionResult = parsePrimaryExpression(tokens, startIndex);
  const operatorToken = tokens[leftExpressionResult.nextIndex];

  if (operatorToken !== "AND") {
    return leftExpressionResult;
  }

  const rightExpressionResult = parsePrimaryExpression(
    tokens,
    leftExpressionResult.nextIndex + 1,
  );

  return parseAndExpressionTail(tokens, {
    nextIndex: rightExpressionResult.nextIndex,
    node: {
      left: leftExpressionResult.node,
      right: rightExpressionResult.node,
      type: "and",
    },
  });
};

const parseAndExpressionTail = (tokens, expressionResult) => {
  const operatorToken = tokens[expressionResult.nextIndex];

  if (operatorToken !== "AND") {
    return expressionResult;
  }

  const rightExpressionResult = parsePrimaryExpression(
    tokens,
    expressionResult.nextIndex + 1,
  );

  return parseAndExpressionTail(tokens, {
    nextIndex: rightExpressionResult.nextIndex,
    node: {
      left: expressionResult.node,
      right: rightExpressionResult.node,
      type: "and",
    },
  });
};

const parseOrExpression = (tokens, startIndex) => {
  const leftExpressionResult = parseAndExpression(tokens, startIndex);
  const operatorToken = tokens[leftExpressionResult.nextIndex];

  if (operatorToken !== "OR") {
    return leftExpressionResult;
  }

  const rightExpressionResult = parseAndExpression(
    tokens,
    leftExpressionResult.nextIndex + 1,
  );

  return parseOrExpressionTail(tokens, {
    nextIndex: rightExpressionResult.nextIndex,
    node: {
      left: leftExpressionResult.node,
      right: rightExpressionResult.node,
      type: "or",
    },
  });
};

const parseOrExpressionTail = (tokens, expressionResult) => {
  const operatorToken = tokens[expressionResult.nextIndex];

  if (operatorToken !== "OR") {
    return expressionResult;
  }

  const rightExpressionResult = parseAndExpression(
    tokens,
    expressionResult.nextIndex + 1,
  );

  return parseOrExpressionTail(tokens, {
    nextIndex: rightExpressionResult.nextIndex,
    node: {
      left: expressionResult.node,
      right: rightExpressionResult.node,
      type: "or",
    },
  });
};

const expressionAllowsNonGplPath = (expressionNode) => {
  if (expressionNode.type === "license") {
    return !isGplFamilyLicense(expressionNode.value);
  }

  return expressionNode.type === "and"
    ? expressionAllowsNonGplPath(expressionNode.left) &&
        expressionAllowsNonGplPath(expressionNode.right)
    : expressionAllowsNonGplPath(expressionNode.left) ||
        expressionAllowsNonGplPath(expressionNode.right);
};

export const licenseExpressionAllowsNonGplPath = (licenseExpression) => {
  const normalizedLicenseExpression =
    normalizeLicenseExpression(licenseExpression);

  if (normalizedLicenseExpression.length === 0) {
    return true;
  }

  const tokens = tokenizeLicenseExpression(normalizedLicenseExpression);
  const parsedExpressionResult = parseOrExpression(tokens, 0);

  if (parsedExpressionResult.nextIndex !== tokens.length) {
    throw new Error(
      `Unexpected token in license expression: ${tokens[parsedExpressionResult.nextIndex]}`,
    );
  }

  return expressionAllowsNonGplPath(parsedExpressionResult.node);
};
