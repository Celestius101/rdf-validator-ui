export const successfulDatasetFixture: string = `
@prefix dash:    <http://datashapes.org/dash#> .
@prefix ex:      <http://example.org/> .
@prefix graphql: <http://datashapes.org/graphql#> .
@prefix owl:     <http://www.w3.org/2002/07/owl#> .
@prefix rdf:     <http://www.w3.org/1999/02/22-rdf-syntax-ns#> .
@prefix rdfs:    <http://www.w3.org/2000/01/rdf-schema#> .
@prefix schema:  <http://schema.org/> .
@prefix sh:      <http://www.w3.org/ns/shacl#> .
@prefix skos:    <http://www.w3.org/2004/02/skos/core#> .
@prefix swa:     <http://topbraid.org/swa#> .
@prefix tosh:    <http://topbraid.org/tosh#> .
@prefix xsd:     <http://www.w3.org/2001/XMLSchema#> .

[ rdf:type     sh:ValidationReport;
  sh:conforms  true;
] .
`;

export const failingDatasetFixture: string = `
@prefix dash:    <http://datashapes.org/dash#> .
@prefix ex:      <http://example.org/> .
@prefix graphql: <http://datashapes.org/graphql#> .
@prefix owl:     <http://www.w3.org/2002/07/owl#> .
@prefix rdf:     <http://www.w3.org/1999/02/22-rdf-syntax-ns#> .
@prefix rdfs:    <http://www.w3.org/2000/01/rdf-schema#> .
@prefix schema:  <http://schema.org/> .
@prefix sh:      <http://www.w3.org/ns/shacl#> .
@prefix skos:    <http://www.w3.org/2004/02/skos/core#> .
@prefix swa:     <http://topbraid.org/swa#> .
@prefix tosh:    <http://topbraid.org/tosh#> .
@prefix xsd:     <http://www.w3.org/2001/XMLSchema#> .

[ rdf:type     sh:ValidationReport;
  sh:conforms  false;
  sh:result    [ rdf:type                      sh:ValidationResult;
                 sh:focusNode                  ex:Bob;
                 sh:resultMessage              "Property needs to have at least 1 value";
                 sh:resultPath                 schema:email;
                 sh:resultSeverity             sh:Violation;
                 sh:sourceConstraintComponent  sh:MinCountConstraintComponent;
                 sh:sourceShape                [] 
               ];
  sh:result    [ rdf:type                      sh:ValidationResult;
                 sh:focusNode                  ex:Bob;
                 sh:resultMessage              "Value does not match pattern established";
                 sh:resultPath                 schema:telephone;
                 sh:resultSeverity             sh:Violation;
                 sh:sourceConstraintComponent  sh:PatternConstraintComponent;
                 sh:sourceShape                [] ;
                 sh:value                      "1234567890"
               ];
  sh:result    [ rdf:type                      sh:ValidationResult;
                 sh:focusNode                  ex:Bob;
                 sh:resultMessage              "Value must be a valid literal of type date e.g. ('YYYY-MM-DD')";
                 sh:resultPath                 schema:birthDate;
                 sh:resultSeverity             sh:Violation;
                 sh:sourceConstraintComponent  sh:DatatypeConstraintComponent;
                 sh:sourceShape                [] ;
                 sh:value                      "14-06-1985"
               ]
] .
`;
