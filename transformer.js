const fs = require('fs');
const yaml = require('yaml');
const parseMD = require('parse-md');

const NC_COLLECTION = 'collections';
const NC_FIELDS = 'fields';
const NC_LIST = 'list';
const NC_RELATION = 'relation';
const NC_DEFAULT_FORMAT = 'frontmatter';    //if format not specified
const NC_DEFAULT_ID = 'title';              //if identifier_field not specified

const SUPPORTED_FORMATS = ['json','frontmatter'];
const PRINT_LOG = true;


exports.load = function(cmsConfigFilePath,  // full path to config file including name 
                        contentRootPath,    // root folder where the folder path defined in config.yml starts
                        api                 // the actions of the gridsome API
                        ){
    //Preparation: parse config.yml of NetlifyCMS to get collection's schema information and init loader
    var parser = new SchemaParser(cmsConfigFilePath);
    if(parser.initialized){
        var loader = new ContentLoader(parser.parseCollections(), contentRootPath, api);
        loader.load();
	}
};


class SchemaCollection{
	constructor(name, label, folder, format, idFieldName){
		this.name = name;
		this.label = label;
		this.folder = folder;
		//this.format = ( format === undefined ) ? NC_DEFAULT_FORMAT : format;
        this.format = format;
		this.idFieldName = idFieldName;
		this.fields = new Map();
		this.gsCollection = undefined;		// Will be added during load
        this.isBlocked = false;             // For load handling - block collection if format is not supported 
	}
	
	addField(fieldName, fieldNode){
		this.fields.set(fieldName, fieldNode);
	}
}

class SchemaNode{
	
	constructor(name, label, widget, parent){
		this.name = name;
		this.label = label;
		this.widget = widget;		
		this.parent = parent; //keep reference to parent
		this.fields = new Map();
		this.relation = {
			collection: '',
			idFieldName: ''
		};
		this.gsObject = undefined;
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

class SchemaParser{
	constructor(cmsConfigFilePath){		
		var cmsConfigFile = cmsConfigFilePath;
		this.collections = new Map();   // use map in order to be able to select collection by name
		this.initialized = true;        // can be checked before proceeding an running into errors
		try{
            var file = fs.readFileSync(cmsConfigFile, 'utf8');
            this.doc = yaml.parseDocument(file);

            this.log("Schema Parser initialized with " + cmsConfigFile);
         }catch(err){
             this.log("Error: " + err);
             this.initialized = false;
         }
	}	
	
	parseCollections(){
        if(this.initialized){
            let i = 0;
            while(this.doc.contents.hasIn([NC_COLLECTION,i])){
                //collections = doc.contents.get('collections');
                let configNode = this.doc.contents.getIn([NC_COLLECTION,i]);
                let name = configNode.get('name');
                this.log('Parsing ' + name);                
                
                //Create Collection in Schema 
                let schemaCollection = new SchemaCollection(
                                        name,
                                        configNode.get('label'),
                                        configNode.get('folder'),
                                        configNode.has('format') ? configNode.get('format') : NC_DEFAULT_FORMAT,
                                        configNode.has('identifier_field') ? configNode.get('identifier_field') : NC_DEFAULT_ID
                                        );
                //Add Collection to list
                this.collections.set(name, schemaCollection);
                //increase depth: get fields of collection
                this.parseFields(configNode, schemaCollection);
                i++;
            }
        }
		return this.collections;
	}

	parseFields(configNode, schemaNode){
		let i = 0;
        //Parse each field and gets its metadata
		while(configNode.hasIn([NC_FIELDS,i])){            
			let configNodeField = configNode.getIn([NC_FIELDS,i]);
			let name = configNodeField.get('name');
            //Create Schema Node
			let schemaField = new SchemaNode(
											name,
											configNodeField.get('label'),
											configNodeField.get('widget'),
											schemaNode
											);
            //Add Field to parent Node (Collection or List Field)
			schemaNode.addField(name, schemaField);
			//Add information if relation
			if(schemaField.isRelation()){
				schemaField.relation.collection = configNodeField.get('collection');
				schemaField.relation.idFieldName = configNodeField.get('valueField');
			}			
			//recursion - increase depth if a list
			if (schemaField.isArray()){
				//this.log("Parsing List: " + name + " in " + schemaNode.name);
				this.parseFields(configNodeField, schemaField);
			}		
			i++;
		}
	}
	
	log(text){
		if (PRINT_LOG) console.log(text);
	}
}


class ContentLoader{
	constructor(schemaCollections,	// The fulle Map of SchemaCollection
				contentRootPath,    // Path of folder where the defined path per collection starts
				api                 // The Gridsome API for building GraphQL
				){
		this.schemaCollections = schemaCollections;
		this.contentRootPath = contentRootPath;  
		this.api = api;
		this.log("Content load initialized");
	}
	
	load(){
        //Gather files per collection and process them based on schema definition
		for (const collection of this.schemaCollections.values()) {
            if(SUPPORTED_FORMATS.includes(collection.format)){
				this.log("Loading Collection " + collection.name);
				this.loadCollection(collection);
			}else{
                collection.isBlocked = true;
				this.log("Format of Collection " + collection.name + " not supported - currently only " + SUPPORTED_FORMATS + " are supported!");
			}					
		}
	}
	
	loadCollection(collection){
	    //Add Collection to gridsome and store references in schema (lists are handled by gridsome)
	    collection.gsCollection = this.api.addCollection(collection.name);        
		let dirPath = this.contentRootPath + collection.folder;
		try{
            //Read directory
            var dirFiles = fs.readdirSync(dirPath, {withFileTypes:true});
            if (dirFiles === undefined){
                this.log("No content files found in " + dirPath);
            }else{
                for (const dirFile of dirFiles){
                    if(dirFile.isFile()){ //only process files
                        //Process each file, depending on format, convert it to JSON
                        let file = fs.readFileSync(dirPath + "/" + dirFile.name, 'utf8');
                        switch(collection.format){
                            case 'json':
                                if(dirFile.name.includes('.json')){
                                    let content = JSON.parse(file);
                                    this.processContent(collection, content);
                                }else{
                                    this.log("Skipped " + dirFile.name + ": Filename extension does not match specified format for collection (" + collection.format + ")");
                                }
                                break;
                            case NC_DEFAULT_FORMAT: //"frontmatter" should be supported because it is default
                                if(dirFile.name.includes('.md')){
                                    var { metadata, content } = parseMD(fileContents);
                                    if (content !== undefined){
                                       //adding the "content" part as body to the rest of the attributes
                                       metadata.body = content;  
                                    }
                                    this.processContent(collection, metadata);
                                }else{
                                    this.log("Skipped " + dirFile.name + ": Filename extension does not match specified format for collection (" + collection.format + ")");
                                }
                                break;
                            default:
                                this.log("Skipped " + dirFile.name + ": File type/format not supported");
                        }                        
                    }else{
                        //All files of a collection should be in one folder -> ignore subfolders (for this collection)
                        this.log("Skipped " + dirFile.name + ": Not a file");
                    }
                }
            }
        } catch (err) {
          this.log("Error: " + err);
        }
	}
    
    // Parse Content/File for given collection and add as node to this collection
	processContent(collection, content){ 
        //Ensure that ID is provided
		if(content[collection.idFieldName] === undefined){
		    return this.log("Skipped " + path + ": ID field '" + collection.idFieldName + "' missing");
		}
		var gsNode = { id: content[collection.idFieldName]};
		//loop over fields of node via schema definition (attributes not defined in schema will be ignored)
		for (let schemaNode of collection.fields.values()){
			if(content[schemaNode.name] !== undefined && schemaNode.name != collection.idFieldName){
				//this.log(schemaNode.name + ": " + content[schemaNode.name]);
                gsNode[schemaNode.name] = this.processEntry(schemaNode, content[schemaNode.name]);
			}			
		}
		//all fields collected for Node -> add to Collection
        collection.gsCollection.addNode(gsNode);
	}
	
    // Parse Entry for given node and return representation to be added to GraphQL
	processEntry(schemaNode, value){
		if (schemaNode.isArray()){
		    //this is a list within a node - add ech content line in array
             var gsArray = [];
			//value is an array -> process list entries recursive
			for (let contentListEntry of value){
                //Per array entry provide the sub-node structure like for other nodes as well
                let gsArrayEntry = {};
				for(let schemaSubNode of schemaNode.fields.values()){
					if(contentListEntry[schemaSubNode.name] !== undefined){
						//Recursion - process sub node                       
                        if(schemaSubNode.isRelation() && schemaNode.fields.size == 1){
                            //For a list of only one relation (without other fields in list entry) it is just an array of references (created in next recursion step) avoiding a parent node per reference
                            gsArrayEntry = this.processEntry(schemaSubNode, contentListEntry[schemaSubNode.name]);
                        }else{
                            gsArrayEntry[schemaSubNode.name] = this.processEntry(schemaSubNode, contentListEntry[schemaSubNode.name]);
                        }
					}
				}
                //One Array Entry processed -> add it to Array representing list
                gsArray.push(gsArrayEntry);
			}
			//after processing all entries, return array to be added in parent node
			return gsArray; //this.api.store.createReference(....);
		}else if (schemaNode.isRelation()){
			//A reference to another node - value is the ID of referenced node
			//this.log(value + " in " + schemaNode.parent.name + "." + schemaNode.name + " references to " + schemaNode.relation.collection + "." + schemaNode.relation.idFieldName);
            if(!this.schemaCollections.has(schemaNode.relation.collection) || this.schemaCollections.get(schemaNode.relation.collection).isBlocked){
                this.log("Reference Skipped: Collection " + schemaNode.relation.collection + " not loaded");
                return value;
            }else{
                return this.api.store.createReference(schemaNode.relation.collection, value);                
            }
		}else{
			//standard field having just a value
			//this.log(value + " in " + schemaNode.parent.name + "." + schemaNode.name);
			return value;
		}
	}
	
	log(text){
		if (PRINT_LOG) console.log(text);
	}	
}





