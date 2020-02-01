const fs = require('fs');
const yaml = require('yaml');

const NC_COLLECTION = 'collections';
const NC_FIELDS = 'fields';
const NC_LIST = 'list';
const NC_RELATION = 'relation';
const DEBUG_MODE = false;


class SchemaCollection{
	constructor(name, label, folder, idFieldName){
		this.name = name;
		this.label = label;
		this.folder = folder;
		this.idFieldName = idFieldName;
		this.fields = new Map();			
	}
	
	addField(fieldName, fieldNode){
		this.fields.set(fieldName, fieldNode);
	}
	
	getIdField(){
		return this.fields.get(this.idFieldName);
	}
	
}

class SchemaNode{
	
	constructor(name, label, widget, parent){
		this.name = name;
		this.label = label;
		this.widget = widget;		
		this.parent = parent; //for calculating full path?
		this.fields = new Map();
		this.relation = {
			collection: '',
			idFieldName: ''
		};	
	}
	
	isRelation(){
		return this.widget == NC_RELATION;
	}
	
	isArray(){
		return this.widget == NC_LIST;
	}
	
	addField(fieldName, fieldNode){
		this.fields.set(fieldName, fieldNode);
	}	
}

exports.parse = function(cmsConfigFilePath){
		var parser = new Parser(cmsConfigFilePath);
		return parser.parseCollections();		
};



class Parser{
	
	constructor(cmsConfigFilePath){		
		var cmsConfigFile = cmsConfigFilePath; //'./config.yml';
		this.collections = new Map();
		var file = fs.readFileSync(cmsConfigFile, 'utf8');
		this.doc = yaml.parseDocument(file);
		
		this.log("Loaded " + cmsConfigFile);
	}	
	
	parseCollections(){
		let i = 0;
		while(this.doc.contents.hasIn([NC_COLLECTION,i])){
			//collections = doc.contents.get('collections');
			let configNode = this.doc.contents.getIn([NC_COLLECTION,i]);
			let name = configNode.get('name');
			this.log('Parsing ' + name);
			let schemaCollection = new SchemaCollection(
									name,
									configNode.get('label'),
									configNode.get('folder'),
									configNode.get('identifier_field')
									);
			this.collections.set(name, schemaCollection);
			//increase depth
			this.parseFields(configNode, schemaCollection);
			i++;
		}
		return this.collections;
	}

	parseFields(configNode, schemaNode){
		let i = 0;
		while(configNode.hasIn([NC_FIELDS,i])){
			let configNodeField = configNode.getIn([NC_FIELDS,i]);
			let name = configNodeField.get('name');
			let schemaField = new SchemaNode(
											name,
											configNodeField.get('label'),
											configNodeField.get('widget'),
											schemaNode
											);
			schemaNode.addField(name, schemaField);
			//Add information if relation
			if(schemaField.isRelation()){
				schemaField.relation.collection = configNodeField.get('collection');
				schemaField.relation.idFieldName = configNodeField.get('valueField');
			}
			
			//recursion - increase depth if a list
			if (schemaField.isArray()){
				this.log("Parse List: " + name + " in " + schemaNode.name);
				this.parseFields(configNodeField, schemaField);
			}		
			i++;
		}
	}
	
	log(text){
		if (DEBUG_MODE) console.log(text);
	}
}





