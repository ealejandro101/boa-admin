#BoA Architecture Definitions

## Digital Content Objects (DCO)

Each DCO is a git repository

A DCO can be a single DCO instance or a collection of DCO.

A DCO can be local or external (remote)



A DCO is composed of:

	* metadata file: (LOM based) (Required) (json recommended)
	* content (distributable content):
		- file(s). Can be empty.
	* manifest file: A file describing the DCO including but not limited to
		- content type: (Local, External, Adaptative)
		- display properties  / View type (html, streaming, interpretated, etc)
		- Default file (If there is no link, this is the file that will initially load)
		- Access type for files (To allow hiding content to users (e.g script files that should not be displayed to end users)
	* source content (all resources required to produce the content) (Optional)


### Stores

A Store is a warehouse for storing common DCOs.
	Eventually there can be owner Stores, corporation stores among others.


### Configuration and Application Data


Security

Search Indexes



Global



### DCO Simple Object (Not collection)

DCO Folder (root)
	- metadata (.metadata.lom)
	- manifest (.manifest)
	- src (Source Content of the object)
	- content (folder for object content)
	
	

Stores
	DCO1 (Simple Object)
		.manifest
		.metadata.xxx (xxx specification)
		src (Always present, non editable)
		content (Always present, non editable)		
	DCO2  (Complex - Collection)
		.manifest
		.metadata.xxx (xxx specification)
		.res.metadata.xxx (xxx specification)
		src (Always present, non editable)
		content (Always present, non editable)
			cat1
				IMG1.jpg									
			cat2 
				img2.png
		
			



	







A relational database will be used to store user management, settings, among others. e.g
	Users
	Roles
	Stores
	Settings




/repository_base_root/
	repo1
	repo2
	...
	repoN





