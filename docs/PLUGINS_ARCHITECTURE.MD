# Plugins Architecture

## Overview

For those familiar with the Eclipse architecture, BoA is based in AjaXplorer which at the same time is based on the same approach : all features provided by the application are packed as « plugins ». Even the GUI itself is a plugin. This allow a huge modularity in creating features, overriding them, creating dependencies between them, etc. Some plugin will implement a given interface or abstract PHP class to give a precise set of features that are « understood » by the core of the application (like the Authentification plugins for example), other can add purely custom features to access a given set of data, manipulate it, add a specific « hello world » button somewhere in the application, etc…

A plug-in is « auto-declarative » via a specific XML file, called manifest.xml. This file contains all information needed to understand how it should be initialized and used, it’s declaring all necessary files and resources used by this plugin, and it will be able to have an impact on server and/or the client side. If the manifest.xml is present inside the plugin folder and its syntax is ok, the plugin can be activated. This is done inside the conf.php file, where the application will declare which plugins are used to create itself. As a namespace prefix is used for all plugins (auth.serial, editor.audio, etc), if the whole namespace is already declared in the conf.php via the « * » wildcard, your plugin will be ready to use.

~~~php
$ACTIVE_PLUGINS = array(« editor.* », « gui.ajax », « hook.* »);
~~~

## Actions

Globally, the key concept that is shared by both the server and the client, and that the plugins will create, extend or override, are the « actions« . Declaring an action « my_action » inside a plugin will allow you to both (or one of both) :

Trigger a JavaScript code snippet on the client side when calling ajaxplorer.fireAction(« my_action »). Don’t worry, generally this action will be also declared to appear as a button in the toolbar, or right-click menu, so you won’t have to bother for this fireAction() call, this is just what the button click does (but it can be interesting to know you can trigger your action manually via a firebug console call for example).
Call a user-defined PHP function (« callback ») to answer a query when calling « my_action » : remember the paramenter get_action described above in this tutorial? This is when it appears : your plugin will define a given function that will be called by the application when content.php?get_action=my_action is called by the client. All http parameters are passed to your callback, so you can do exactly anything you want with it.
As you should understand, with this simple system, a plugin can indeed declare a « whatever-you-want-that-has-nothing-to-do-with-file-manipulation-or-data-browsing » action! You can trigger, from withing a very simple plugin declaration (XML file), a javascript call to your custom action on the PHP server.

Plugins can do much more, particularly by customizing GUI components on the fly on the client side. But to understand this we first have to introduce the XML Registry notion.

## Building XML Registry from plugins manifests

### Seeing plugins as registry contributions
Given this plugin architecture, the registry is here to gather all informations about the currently available (and active) plugins and feed the server and the client with the data they need.As nearly everything in plugins is defined inside XML, it is thus logic that this registry is itself a « big » XML Document, that merges all informations from all plugins. And in fact, you should see it the other way round : every XML node declared somewhere in the XML manifest file of the plugins are just fragments of a bigger document, the XML registry. This allows to merge XML branches that have the same parent node into one.

### XML Merging example

For example, if one active plugin contains the node plugin/actions/action[name='action1'] and another one contains the same kind of structure with [name='action2'], both <action> nodes will be merged under one unique <actions> branch in the registry. Going further, if a third plugin contains a node plugin/actions/action[name='action1']/action_detail, this <action_detail> subnode will be appended to the <action name=’actions1′> node declared by the first plugin inside the registry. Want to understand this better? Open some manifest.xml files that are inside plugins you are indeed using, then call content.php?get_action=get_xml_registry to see the big picture!

This mechanism of XML merging is one of the important legs of the plugins architecture, as it allows to dynamically append or overwrite the XML contributions of a given plugin from within another one! And since this XML registry is the unique interface between the world and the plugin, and that all Javascript or PHP calls are declared in this XML, you can understand the power of this extension mechanism. In fact, it’s clearly converging with the well-known Eclipse Osgi architecture.

### Importing external XML Nodes

Last thing need to use these XML files nearly as a language scripting is to be able to insert a given set of XML from another file into a Manifest. For example, the FTP plugin is using all the same actions as the FS plugin, so it would be useless to have to re-declare all actions definitions in the FTP plugin. The <external_file> key is here to do the job : with an include/exclude mechanism that takes XPath expression as arguments, it allows you to import all the nodes returned by the include expression inside your current XML.

### Dependencies mechanism

At this point, you might ask your self « how to be sure that one plugin will be loaded after another? » so that plugin B overrides plugin A data and not the opposite? The third leg of the plugin mechanism indeed resides in the « dependencies » mechanism, once again declared in the manifest.xml file. If a plugin B declares that it depends on plugin A, it will indeed be loaded (and integrated to the registry) after plugin A, or not loaded at all if plugin A is not present. This mechanism can play at load level and at activation level.

## How the registry is changing in time

Now that you understand that the registry is built from the bunch of plugins contributions, you must understand how central it is in the way application, particularly the GUI. By nature, some plugins (namely the access.*, auth.* and serial.* ones) can have only one instance linked to a given state of the application. For example, even if auth.serial, auth.remote, auth.ldap, etc, are available plugins, only one can be active at a time in each category of plugin. Going further, the active plugin in this given category can dynamically change its own registry contributions, depending on the state of the current session!

Try this : log in to ajaxplorer, then in another tab call content.php?get_action=get_xml_registry. Observe how the current <user> data is passed inside the registry? Now log out and update your registry : <user> is out. It’s exactly the same when you are switching repository : the registry is totally rebuilt, given the registry_contributions of the active access.* plugin, which is determined by the current repository.

The GUI Ajax client itself is based on the XML Registry : since the XML registry is evolving in time during a session, it must be partially or totally reloaded by the client when some predefined events occur (login, logout, switch_repository, etc…). This allow also to pass GUI components configuration to the client via the registry, and they will be reparsed and reapplyed on-the-fly (if the target components allows it). See Ajax GUI > Updating components configurations.


# Plugin case study : editor.audio

Better than thousand chapters, lets study the editor.audio plugin. It takes a good picture of the abilities of the plugins : XML extensions, actions, javascript code and PHP callbacks, post/pre processing… Open the audio.editor/manifest.xml file.

## Basic definition

~~~ xml
<editor id="editor.audio" openable="false" className="AudioPreviewer" mimes="mp3" ...>
	<class_definition filename="plugins/editor.audio/class.AudioPreviewer.php" classname="AudioPreviewer"/>
	<client_settings>
		<resources>
			<js file="plugins/editor.audio/class.AudioPreviewer.js" className="AudioPreviewer"/>
			<i18n namespace="audio_editor" path="plugins/editor.audio/i18n"/>
		</resources>
	</client_settings>
	<dependencies>
		<activePlugin pluginName="access.fs|access.ftp|access.demo|access.remote_fs"/>
	</dependencies>
</editor>
~~~

What we find here determines some bases of this plugin. First the <editor> node gives this plugin an id, a type (name of the node), and then two editor specific properties : openable (whether it can indeed open an editor, or if not just be used as a preview manager for the given mime type), mimes (a set of mimes comma-separated that will be supported), and className (that would be the class called by Javascript if the editor was openable).

Then the following tags concerns dependencies and resources loading : class_definition is the PHP class used by the eventual serverCallbacks (see after), resources can be JS, CSS or Images libraries that will be needed to load the plugin on the client side (here the AudioPreviewer js class), and dependencies defines how this plugin will be activated depending on the currently active plugins. Here, we must be sure that one of the plugins listed with pipes at least is active.

## Actions definitions, pre and post processing on server.

Now the rest of the file concerns the registry_contributions. You’ll find three types of contributions here, all are actions :

* **audio_proxy** : this is simply a server-side contribution. This means that the PHP class of the plugin (AudioPreviewer.php) must be able to handle an http query containing the paramater get_action=audio_proxy, that’s all we know,

* **play_whole_folder** : this one is on the contrary a client-side contribution : it defines a "Play Whole Folder" action that will appear in the InfoPanel when selecting an mp3 file. What happens when clicking on this action is totally writen in the clientCallback.

* **ls** : this one will append itself to the basic ls action present in all access.* plugins. It will in fact append the pre_processing and post_processing tags. If their applyCondition is effective, these callbacks will be called respectively before and after the standard « ls » processing. What is said here is in fact the following : apply these callback before and after « ls » when the query contains « playlist », e.g. get_action=ls&playlist=true. In our case, this will in fact transform the standard « ls » output in XSPF playlist format!

Basically pre_processing and post_processing callbacks apply like follows : pre_processing takes all the «standard» callbacks arguments by reference, and can change them. If there is post_processing, both pre_ and «standard» callbacks are called with output_buffering on, then the output is redirected to the post_processor. Warning, some «exit()» call may make this useless, we still have to clean that.

## Class Implementations

Have a look at the class.AudioPreviewer.js : it implements the basic needs of an editor : getPreview and getThumbnailSource. In fact, editor can be attached to a given mime, and for this mime, it can create the simple or rich preview (used respectively by the FilesList in thumb mode and by the infoPanels), and if « openable », open a file and view/edit it inline (see editor.text for example). Warning, the element returned by the getPreview method must have a resizePreviewElement attached to itself. As you can see, and as describe above, the basic atom passed to these method are always the ajxpNode. Last, in our case, we use this class to write the createFolderPlayer function. We could have written it « inline » inside the manifest.xml, but it’s cleaner and easyer to debug to write it in a real js file, and then call it in the manifest.xml code snippet as a static method (thus using the « prototype » keyword).

On the server side, you can follow the « ls » case inside class.AudioPreviewer.php : when preProcessAction is called, the « dir » parameter is just base64_decoded inside the httpVars (very usefull to base64 encode when dealing with flash and utf8…), then as post_processing, the « ls » output is parsed as an XML doc (which it is indeed) and rewritten in a new format. The « audio_proxy » action just reads the data to the output with the right headers. It uses the Ajaxplorer StreamWrapper to access the data throught various protocols.

# References

For more information please refer to the [AjaXplorer Documentation].


[AjaXplorer Documentation]: http://support.ajaxplorer.info/redmine/projects/ajaxplorer/wiki/Developer_Documentation