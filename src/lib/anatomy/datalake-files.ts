/**
 * Repository paths of the datalake files the atlas reads but does not own:
 * the catalog's registrar, its region table and its pathway list. They have no
 * parser module of their own here, so every error message and source reference
 * that names one imports the path from this file.
 */

export const REGISTRAR_FILE = 'datalake/qtara-registrar.json';
export const ATLAS_FILE = 'datalake/qif-brain-bci-atlas.json';
export const PATHWAYS_FILE = 'datalake/qif-neural-pathways.json';
