import rdf from 'rdf-ext';
import DatasetExt from 'rdf-ext/lib/Dataset';
import { ValidationReport } from '../models/validation-report';
import namespace from '@rdfjs/namespace';
import { Parser } from 'n3';
import QuadExt from 'rdf-ext/lib/Quad';
import Clownface from 'clownface';
import { mapSeverity, ValidationResult } from '../models/validation-result';

export const ns = {
    dash: namespace('http://datashapes.org/dash#'),
    ex: namespace('http://example.org'),
    graphql: namespace('http://datashapes.org/graphql#'),
    owl: namespace('http://www.w3.org/2002/07/owl#'),
    rdf: namespace('http://www.w3.org/1999/02/22-rdf-syntax-ns#'),
    rdfs: namespace('http://www.w3.org/2000/01/rdf-schema#'),
    schema: namespace('http://schema.org/'),
    sh: namespace('http://www.w3.org/ns/shacl#'),
    skos: namespace('http://www.w3.org/2004/02/skos/core#'),
    swa: namespace('http://topbraid.org/swa#'),
    tosh: namespace('http://topbraid.org/tosh#'),
    xsd: namespace('http://www.w3.org/2001/XMLSchema#'),
};

export const prefixes = {
    'http://example.org/': 'ex:',
    'http://schema.org/': 'schema:',
    'http://www.w3.org/ns/shacl#': 'sh:',
    'http://datashapes.org/dash#': 'dash:',
    'http://datashapes.org/graphql#': 'graphql:',
    'http://www.w3.org/2002/07/owl#': ' owl:',
    'http://www.w3.org/1999/02/22-rdf-syntax-ns#': 'rdf:',
    'http://www.w3.org/2000/01/rdf-schema#': 'rdfs:',
    'http://www.w3.org/2004/02/skos/core#': 'skos',
    'http://topbraid.org/swa#': 'swa:',
    'http://topbraid.org/tosh#': 'tosh',
    'http://www.w3.org/2001/XMLSchema#': 'xsd',
};

/**
 * Replaces the namespace of an RDF node by its prefix
 *
 * @param value The string in which to replace the namespace
 * @return The provided string with prefix
 */
export const toPrefixed = (value?: string): string | undefined => {
    if (!value) return undefined;
    for (const [uri, prefix] of Object.entries(prefixes)) {
        if (value.startsWith(uri)) {
            return value.replace(uri, prefix);
        }
    }
    return value;
};

/**
 * Converts a turtle file (in string form) into a browsable RDF Dataset.
 *
 * @param result A turtle file representing a RDF graph
 * @returns A promise resolving when the string is converted or rejecting when an error is encountered
 */
export const processValidationResult = (
    result: string
): Promise<DatasetExt> => {
    const dataset = rdf.dataset();
    const parser = new Parser();

    return new Promise((resolve, reject) => {
        try {
            parser.parse(result, (error: Error, quad: QuadExt) => {
                if (error) {
                    reject(error);
                } else if (quad) {
                    dataset.add(quad);
                } else {
                    resolve(dataset);
                }
            });
        } catch (err) {
            reject(err);
        }
    });
};

/**
 * Extracts relevant information in the validation report from a given RDF dataset.
 *
 * @param dataset The dataset from which to extracts the validation report information
 * @returns A boolean saying whether the validation succeeded and an array of results giving more details what failed otherwise.
 */
export const extractValidationReport = (
    dataset: DatasetExt
): ValidationReport => {
    const graph = Clownface({ dataset });

    const validationReport = graph.has(ns.rdf.type, ns.sh.ValidationReport);

    const conforms =
        validationReport
            .out(ns.sh.conforms)
            .toArray()
            .map((node) => node.value)[0] === 'true';

    const results: ValidationResult[] = validationReport
        .out(ns.sh.result)
        .toArray()
        .map((result) => ({
            focusNode: toPrefixed(result.out(ns.sh.focusNode).value) || '',
            message: result.out(ns.sh.resultMessage).value || '',
            path: toPrefixed(result.out(ns.sh.resultPath).value) || '',
            severity: mapSeverity(result.out(ns.sh.resultSeverity).value),
            sourceConstraintComponent:
                toPrefixed(result.out(ns.sh.sourceConstraintComponent).value) ||
                '',
            value: result.out(ns.sh.value).value,
        }));

    return {
        conforms,
        results,
    };
};
