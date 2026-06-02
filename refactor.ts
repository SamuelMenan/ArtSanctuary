import { Project, SyntaxKind } from "ts-morph";

const project = new Project();
project.addSourceFilesAtPaths("src/app/api/**/route.ts");

const files = project.getSourceFiles();

const STATUS_MAP: Record<number, string> = {
  401: "UNAUTHORIZED",
  403: "FORBIDDEN",
  404: "NOT_FOUND",
  400: "VALIDATION_ERROR",
  409: "CONFLICT",
  413: "PAYLOAD_TOO_LARGE",
  415: "UNSUPPORTED_MEDIA_TYPE",
  500: "INTERNAL_ERROR",
};

for (const sourceFile of files) {
  let modified = false;

  const hasWithErrorHandler = sourceFile.getImportDeclaration(dec => dec.getModuleSpecifierValue() === "@backend/http/handler");
  const hasApiError = sourceFile.getImportDeclaration(dec => dec.getModuleSpecifierValue() === "@backend/http/errors");
  
  const functions = sourceFile.getFunctions().filter(f => f.isExported() && f.getName()?.match(/^(GET|POST|PUT|PATCH|DELETE)$/));
  
  if (functions.length > 0) {
    if (!hasWithErrorHandler) {
      sourceFile.addImportDeclaration({
        namedImports: ["withErrorHandler"],
        moduleSpecifier: "@backend/http/handler"
      });
    }
    if (!hasApiError) {
      sourceFile.addImportDeclaration({
        namedImports: ["apiError"],
        moduleSpecifier: "@backend/http/errors"
      });
    }
  }

  for (const fn of functions) {
    const name = fn.getName();
    if (!name) continue;
    const params = fn.getParameters().map(p => p.getText()).join(", ");
    const body = fn.getBody();
    if (!body) continue;
    let bodyText = body.getText();
    
    bodyText = bodyText.substring(1, bodyText.length - 1).trim();

    const tryStatement = body.getFirstDescendantByKind(SyntaxKind.TryStatement);
    if (tryStatement && tryStatement.getParent() === body) {
      const tryBlock = tryStatement.getTryBlock();
      bodyText = tryBlock.getText();
      bodyText = bodyText.substring(1, bodyText.length - 1).trim();
    }

    bodyText = bodyText.replace(/return\s+NextResponse\.json\(\s*\{\s*error:\s*(['"`].*?['"`])\s*\}\s*,\s*\{\s*status:\s*(\d+)\s*\}\s*\);?/g, (match, msg, status) => {
      const code = STATUS_MAP[parseInt(status, 10)] || "INTERNAL_ERROR";
      return `return apiError("${code}", ${msg});`;
    });

    const routePath = sourceFile.getFilePath().split("src/app")[1].replace("/route.ts", "");
    const tag = `${name} ${routePath}`;

    const newCode = `export const ${name} = withErrorHandler("${tag}", async (${params}) => {\n  ${bodyText}\n});`;
    
    fn.replaceWithText(newCode);
    modified = true;
  }

  const varDecls = sourceFile.getVariableDeclarations().filter(v => v.getName()?.match(/^(GET|POST|PUT|PATCH|DELETE)$/));
  for (const v of varDecls) {
    const init = v.getInitializer();
    if (init && init.getKind() === SyntaxKind.CallExpression && init.getText().includes("withErrorHandler")) {
       let text = init.getText();
       text = text.replace(/return\s+NextResponse\.json\(\s*\{\s*error:\s*(['"`].*?['"`])\s*\}\s*,\s*\{\s*status:\s*(\d+)\s*\}\s*\);?/g, (match, msg, status) => {
          const code = STATUS_MAP[parseInt(status, 10)] || "INTERNAL_ERROR";
          return `return apiError("${code}", ${msg});`;
       });
       init.replaceWithText(text);
       modified = true;
       
       if (!hasApiError && sourceFile.getText().includes("apiError(")) {
          sourceFile.addImportDeclaration({
             namedImports: ["apiError"],
             moduleSpecifier: "@backend/http/errors"
          });
       }
    }
  }

  if (modified) {
    sourceFile.organizeImports();
    sourceFile.saveSync();
    console.log("Updated", sourceFile.getFilePath());
  }
}
