<?php
// This file is part of BoA - https://github.com/boa-project
//
// BoA is free software: you can redistribute it and/or modify
// it under the terms of the GNU Affero General Public License as published by
// the Free Software Foundation, either version 3 of the License, or
// (at your option) any later version.
//
// BoA is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
// GNU Affero General Public License for more details.
//
// You should have received a copy of the GNU General Public License
// along with BoA.  If not, see <http://www.gnu.org/licenses/>.
//
// The latest code can be found at <https://github.com/boa-project/>.
 
/**
 * This is a one-line short description of the file/class.
 *
 * You can have a rather longer description of the file/class as well,
 * if you like, and it can span multiple lines.
 *
 * @package    [App Plugins]
 * @category   [Meta]
 * @copyright  2017 BoA Project
 * @license    https://www.gnu.org/licenses/agpl-3.0.html GNU Affero GPL v3 or later
 */
namespace BoA\Plugins\Meta\Lom;

use BoA\Core\Access\UserSelection;
use BoA\Core\Http\Controller;
use BoA\Core\Http\HTMLWriter;
use BoA\Core\Http\XMLWriter;
use BoA\Core\Plugins\Plugin;
use BoA\Core\Services\AuthService;
use BoA\Core\Services\ConfService;
use BoA\Core\Services\PluginsService;
use BoA\Core\Utils\Utils;
use BoA\Core\Xml\ManifestNode;
use BoA\Plugins\Access\Dco\DcoSpecProvider;

defined('APP_EXEC') or die( 'Access not allowed');

class LomMetaManager extends Plugin implements DcoSpecProvider {
    const PUBLISHED_STATUS = 'published';
    const INPROGRESS_STATUS = 'inprogress';
    /**
     * @var AbstractAccessDriver
     */
    protected $accessDriver;
    /**
     * @var MetaStoreProvider
     */
    protected $metaStore;
    private $mess;

    public function init($options){
        $this->options = $options;
        // Do nothing
    }

    public function initMeta($accessDriver){
        $this->accessDriver = $accessDriver;

        /*$store = PluginsService::getInstance()->getUniqueActivePluginForType("metastore");
        if($store === false){
                throw new \Exception("The 'meta.lom' plugin requires at least one active 'metastore' plugin");
        }
        $this->metaStore = $store;
        $this->metaStore->initMeta($accessDriver);*/

        //$messages = ConfService::getMessages();
        /****** JO Commented this
        $def = $this->getMetaDefinition();
        if(!isSet($this->options["meta_visibility"])) $visibilities = array("visible");
        else $visibilities = explode(",", $this->options["meta_visibility"]);
        $cdataHead = '<div>
                        <div class="panelHeader infoPanelGroup" colspan="2"><span class="icon-edit" data-action="edit_lom_meta" title="APP_MESSAGE[meta_lom.1]"></span>APP_MESSAGE[meta_lom.1]</div>
                        <table class="infoPanelTable" cellspacing="0" border="0" cellpadding="0">';
        $cdataFoot = '</table></div>';
        $cdataParts = "";
        
        $selection = $this->xPath->query('registry_contributions/client_configs/component_config[@className="FilesList"]/columns');
        $contrib = $selection->item(0);   
        $even = false;
        $searchables = array();
        $index = 0;
        $fieldType = "text";
        foreach ($def as $key=>$label){
            if(isSet($visibilities[$index])){
                    $lastVisibility = $visibilities[$index];
            }
            $index ++;
            $col = $this->manifestDoc->createElement("additional_column");
            $col->setAttribute("messageString", $label);
            $col->setAttribute("attributeName", $key);
            $col->setAttribute("sortType", "String");
            if(isSet($lastVisibility)) $col->setAttribute("defaultVisibilty", $lastVisibility);
            if($key == "stars_rate"){
                $col->setAttribute("modifier", "MetaCellRenderer.prototype.starsRateFilter");
                $col->setAttribute("sortType", "CellSorterValue");
                $fieldType = "stars_rate";
            }else if($key == "css_label"){
                $col->setAttribute("modifier", "MetaCellRenderer.prototype.cssLabelsFilter");
                $col->setAttribute("sortType", "CellSorterValue");
                $fieldType = "css_label";
            }else if(substr($key,0,5) == "area_"){
                    $searchables[$key] = $label;
                    $fieldType = "textarea";
            }else{
                $searchables[$key] = $label;
                $fieldType = "text";
            }
            $contrib->appendChild($col);
            
            $trClass = ($even?" class=\"even\"":"");
            $even = !$even;
            $cdataParts .= '<tr'.$trClass.'><td class="infoPanelLabel">'.$label.'</td><td class="infoPanelValue" data-metaType="'.$fieldType.'" id="ip_'.$key.'">#{'.$key.'}</td></tr>';
        }*/
        
        /****** JO Commented this
        $selection = $this->xPath->query('registry_contributions/client_configs/component_config[@className="InfoPanel"]/infoPanelExtension');
        $contrib = $selection->item(0);
        $contrib->setAttribute("attributes", implode(",", array_keys($def)));
        if(isset($def["stars_rate"]) || isSet($def["css_label"])){
            $contrib->setAttribute("modifier", "LomMetaCellRenderer.prototype.infoPanelModifier");
        }
        $htmlSel = $this->xPath->query('html', $contrib);
        $html = $htmlSel->item(0);
        $cdata = $this->manifestDoc->createCDATASection($cdataHead . $cdataParts . $cdataFoot);
        $html->appendChild($cdata);
        
        $selection = $this->xPath->query('registry_contributions/client_configs/template_part[@appClass="SearchEngine"]');
        foreach($selection as $tag){
            $v = $tag->attributes->getNamedItem("appOptions")->nodeValue;
            $metaV = count($searchables)? '"metaColumns":'.json_encode($searchables): "";
            if(!empty($v) && trim($v) != "{}"){
                $v = str_replace("}", ", ".$metaV."}", $v);
            }else{
                $v = "{".$metaV."}";
            }
            $tag->setAttribute("appOptions", $v);
        }
        */
        parent::init($this->options);
    
    }
        
    protected function getMetaDefinition(){
        /******* JO Commented this
        foreach($this->options as $key => $val){
            $matches = array();
            if(preg_match('/^lom_meta_fields_(.*)$/', $key, $matches) != 0){
                $repIndex = $matches[1];
                $this->options["lom_meta_fields"].=",".$val;
                $this->options["lom_meta_labels"].=",".$this->options["lom_meta_labels_".$repIndex];
                if(isSet($this->options["lom_meta_visibility_".$repIndex]) && isSet($this->options["lom_meta_visibility"])){
                    $this->options["lom_meta_visibility"].=",".$this->options["lom_meta_visibility_".$repIndex];
                }
            }
        }

        $fields = $this->options["lom_meta_fields"];
        $arrF = explode(",", $fields);
        $labels = $this->options["lom_meta_labels"];
        $arrL = explode(",", $labels);

        $result = array();
        foreach ($arrF as $index => $value){
            if(isSet($arrL[$index])){
                $result[$value] = $arrL[$index];
            }else{
                $result[$value] = $value;
            }
        }
        return $result;  */ 
        return array();
    }
    
    /**
     *
     * @param ManifestNode $node
     * @param bool $contextNode
     * @param bool $details
     * @return void
     */
    public function extractMeta(&$node, $contextNode = false, $details = false){
        $metaPath = $node->getUrl();
        if (is_dir($metaPath) && $node->APP_mime != 'dco') return;

        $this->mess = ConfService::getMessages();
        $isRoot = is_dir($metaPath);
        if ($isRoot){

            $metaPath .= "/.manifest";
        }
        else {
            $metaPath = dirname($metaPath)."/.".basename($metaPath).".manifest";
            $overlay = 'dro.png';
        }
        if (!file_exists($metaPath)) return;
        $content = file_get_contents($metaPath);
        $meta = json_decode($content);
        $metadata = array("lommetadata" => json_encode($meta->metadata));

        if (!$isRoot){
            $metadata["status_id"] = $meta->manifest->status;
            $metadata["status"] = $this->mess["access_dco.".$meta->manifest->status];
            $metadata["lastupdated"] = $meta->manifest->lastupdated;
            if (isset($meta->manifest->lastpublished)){
                $metadata["lastpublished"] = $meta->manifest->lastpublished;    
            }
        }
        $status = $meta->manifest->status;
        if ($status == self::PUBLISHED_STATUS){
            if (isset($meta->manifest->lastpublished) && $meta->manifest->lastpublished < $meta->manifest->lastupdated){
                $overlay = (isset($overlay)?$overlay.",":"")."alert.png";
            }
            else {
                $overlay = (isset($overlay)?$overlay.",":"")."ok.png";
            }
            
        }
        else if ($status == self::INPROGRESS_STATUS) {
            $overlay = (isset($overlay)?$overlay.",":"")."alert.png";
        }
        if (isset($overlay)){
            $metadata['overlay_icon'] = $overlay;
        }
        $node->mergeMetadata($metadata);
    }
    
    /**
     * 
     * @param ManifestNode $oldFile
     * @param ManifestNode $newFile
     * @param Boolean $copy
     */
    public function updateMetaLocation($oldFile, $newFile = null, $copy = false){
        if($oldFile == null) return;
            if(!$copy && $this->metaStore->inherentMetaMove()) return;
        
        $oldMeta = $this->metaStore->retrieveMetadata($oldFile, "lom_meta", false, APP_METADATA_SCOPE_GLOBAL);
        if(!count($oldMeta)){
            return;
        }
        // If it's a move or a delete, delete old data
        if(!$copy){
            $this->metaStore->removeMetadata($oldFile, "lom_meta", false, APP_METADATA_SCOPE_GLOBAL);
        }
        // If copy or move, copy data.
        if($newFile != null){
            $this->metaStore->setMetadata($newFile, "lom_meta", $oldMeta, false, APP_METADATA_SCOPE_GLOBAL);
        }
    }

    public function onGet($action, $httpVars, $fileVars){
        
        $mess = $this->mess = ConfService::getMessages();
        switch ($action) {
            case 'get_spec_by_id':
                $this->getSpecById($httpVars["spec_id"]);
                break;
            case 'get_specs_list':
                $this->loadSpecsAsJson();
                break;
            
            case 'mkdco':
                XMLWriter::header("output");
                $messtmp="";
                $dconame=Utils::decodeSecureMagic($httpVars["dirname"], APP_SANITIZE_HTML_STRICT);
                $dconame = substr($dirname, 0, ConfService::getCoreConf("NODENAME_MAX_LENGTH"));
                $this->filterUserSelectionToHidden(array($dirname));
                Controller::applyHook("node.before_create", array(new ManifestNode($dir."/".$dirname), -2));
                $error = $this->mkDir($dir, $dirname);
                if(isSet($error)){
                    throw new ApplicationException($error);
                }
                $messtmp.="$mess[38] ".SystemTextEncoding::toUTF8($dirname)." $mess[39] ";
                if($dir=="") {$messtmp.="/";} else {$messtmp.= SystemTextEncoding::toUTF8($dir);}
                $logMessage = $messtmp;
                //$pendingSelection = $dirname;
                //$reloadContextNode = true;
                $newNode = new ManifestNode($this->urlBase.$dir."/".$dirname);
                if(!isSet($nodesDiffs)) $nodesDiffs = $this->getNodesDiffArray();
                array_push($nodesDiffs["ADD"], $newNode);
                Logger::logAction("Create DCO", array("dir"=>$dir."/".$dirname));
                XMLWriter::close("output");
                break;

            default:
                break;
        }

    }

    public function onPost($action, $httpVars, $fileVars){
        $this->mess = ConfService::getMessages();
        switch ($action) {
            case "save_dcometa":
                $this->saveDcoMeta($action, $httpVars, $fileVars);
            break;
            case "publish_metadata":
                $this->publish();
        }
    }

    private function loadSpecsAsJson(){
        $list = $this->loadSpecs();
        header('Content-Type: application/json; charset=UTF-8');
        header('Cache-Control: no-cache');
        print(json_encode(array("LIST" => $list)));
    }
    
    private function parseParameters(&$repDef, &$options, $userId = null, $globalBinaries = false){
        Utils::parseStandardFormParameters($repDef, $options, $userId, "DCO_", ($globalBinaries?array():null));
    }

    private function readSpecFieldToJson($specField, $specXpath, &$parent, $parambasename, $meta, $colrow=""){
        if (!$specField->hasAttribute("enabled") || !$specField->attributes["enabled"]->nodeValue){
            return false;
        }
        $type = $specField->getAttribute("type");
        $translatable = $specField->getAttribute("translatable");
        $isContainer = $type == "container";
        if ($type == "composed" || $isContainer){
            $isCollection = $specField->getAttribute("collection") == "true";
            $paramprefix = $isContainer ? $parambasename : $parambasename."_".$specField->nodeName;
            if ($isCollection){
                if ($isContainer){
                    $target = &$parent;
                }
                else {
                    $target = array();
                    $parent[$specField->nodeName] = &$target;
                }
                
                $itemsFound = true;
                $index = 0;
                while($itemsFound){
                    $colrow = $index>0?"_$index":"";
                    $newObj = array();
                    foreach ($specField->childNodes as $child) {
                        if ($child->nodeType != XML_ELEMENT_NODE) continue;
                        //if ($child->nodeType == XML_CDATA_SECTION_NODE) continue;
                        $itemsFound = $this->readSpecFieldToJson($child, $specXpath, $newObj, $paramprefix, $meta, $colrow);
                        if (!itemsFound){
                            break;
                        }
                    }
                    if ($itemsFound){
                        $target[] = $newObj;
                        $index++;
                    }
                }
            }
            else{
                $newObj = $parent[$specField->nodeName] = array();
                foreach ($specField->childNodes as $child) {
                    if ($child->nodeType != XML_ELEMENT_NODE) continue;
                    //if ($child->nodeType == XML_CDATA_SECTION_NODE) continue;
                    $this->readSpecFieldToJson($child, $specXpath, $newObj, $paramprefix.$colrow, $meta);
                }
            }

        }
        else if ($type == "duration"){
            $segments = explode(" ", "years months days hours minutes seconds");
            $newObj = array();
            $ret = false;
            foreach ($segments as $segment) {
                $key = $parambasename."_".$specField->nodeName."_".$segment;
                if (array_key_exists($key, $meta)){
                    $newObj[$segment] = ctype_digit($meta[$key])?intval($meta[$key]):0;
                    $ret = true;
                }
            }
            if ($ret) {
                $parent[$specField->nodeName] = $newObj;
            }
            return $ret;
        }
        else if ($type == 'keywords'){
            $key = $parambasename."_".$specField->nodeName.$colrow;
            if (array_key_exists($key, $meta)){
                if ($translatable) {
                    $translations = json_decode($meta[$key]);
                    $value = array();
                    foreach (get_object_vars($translations) as $lang => $langValue) {
                        $value[$lang] = is_array($langValue) ? $langValue : array_map('trim', explode(',', $langValue));
                    }
                    $parent[$specField->nodeName] = $value;
                }
                else {
                    $parent[$specField->nodeName] = array_map('trim', explode(',', $meta[$key]));
                }
                return true;
            }
            return false;
        }
        else{
            $specType = $specXpath->query("//types/type[@name='$type']");
            if ($specType->length > 0){
                $newObj = array();
                $ret = false;
                foreach ($specType[0]->childNodes as $child) {
                    $key = $parambasename."_".$specField->nodeName."_".$child->nodeName.$colrow;
                    if (array_key_exists($key, $meta)){
                        $newObj[$child->nodeName] = $meta[$key];
                        $ret = true;
                    }
                }
                if ($ret){
                    $parent[$specField->nodeName] = $newObj;    
                }
                return $ret;
            }
            $key = $parambasename."_".$specField->nodeName.$colrow;
            
            if (array_key_exists($key, $meta)){                
                if ($translatable){
                    $parent[$specField->nodeName] = json_decode($meta[$key]);
                }
                else {
                    $parent[$specField->nodeName] = $meta[$key];
                }
                return true;
            }
            return false;
        }
    }

    private function saveDcoMeta($actionName, $httpVars, $fileVars){
        if(!isSet($this->actions[$actionName])) return;
        if(is_a($this->accessDriver, "demoAccessDriver")){
            throw new Exception("Write actions are disabled in demo mode!");
        }
        $repo = $this->accessDriver->repository;
        $user = AuthService::getLoggedUser();
        if(!AuthService::usersEnabled() && $user!=null && !$user->canWrite($repo->getId())){
            throw new Exception("You have no right on this action.");
        }
        $selection = new UserSelection();
        $selection->initFromHttpVars();
        $currentFile = $selection->getUniqueFile();
        $urlBase = $this->accessDriver->getResourceUrl($currentFile);
        //$node = new ManifestNode($urlBase);
        $meta = array();
        $this->parseParameters($httpVars, $meta, null, true);
        $spec_id = $httpVars["spec_id"];
        $spec = $this->getSpecById($spec_id, false);
        $xpath = new \DOMXPath($spec);
        $categories = $xpath->query("/spec/fields/*[@type='category']");

        $metaobject = array();
        foreach($categories as $category){
            $metaobject[$category->nodeName] = array();
            foreach ($category->childNodes as $field){
                if ($field->nodeType != XML_ELEMENT_NODE) continue;
                //if ($field->nodeType == XML_CDATA_SECTION_NODE) continue;
                $this->readSpecFieldToJson($field, $xpath, $metaobject[$category->nodeName], "meta_fields_".$category->nodeName, $meta, "");
            }
        }

        $isRoot = is_dir($this->accessDriver->urlBase.$currentFile);
        $target = $isRoot?$currentFile."/.manifest":
            dirname($currentFile)."/.".basename($currentFile).".manifest";

        $target = $this->accessDriver->urlBase.$target;
        $json = (file_exists($target) ? json_decode(file_get_contents($target)) : new \stdClass());
        $fp = fopen($target, "w");
        if($fp !== false){
            if (!isset($json->manifest)) {
                $json->manifest = new \stdClass();
                $json->manifest->title = basename($currentFile);
                $json->manifest->type = $spec_id;
                $json->manifest->status = self::INPROGRESS_STATUS;
                $json->manifest->id = $currentFile;
            }
            if (!isset($json->manifest->is_a)){
                $json->manifest->is_a = $isRoot?'dco':'dro';
            }
            $json->manifest->lastupdated = date('c');
            $json->metadata = $metaobject;
            $data = json_encode($json);
            @fwrite($fp, $data, strlen($data));
            @fclose($fp);
        }
        //Controller::applyHook("node.meta_change", array($node));
        HTMLWriter::charsetHeader("application/json");
        echo isSet($data)?$data:"{}";
    }

    private function publish(){
        $repo = $this->accessDriver->repository;
        $user = AuthService::getLoggedUser();
        if(!AuthService::usersEnabled() && $user!=null && !$user->canWrite($repo->getId())){
            throw new Exception("You have no right on this action.");
        }

        $selection = new UserSelection();
        $selection->initFromHttpVars();
        $currentFile = $selection->getUniqueFile();
        $urlBase = $this->accessDriver->getResourceUrl($currentFile);

        $isRoot = is_dir($this->accessDriver->urlBase.$currentFile);
        $manifestPath = $isRoot?$currentFile."/.manifest":
            dirname($currentFile)."/.".basename($currentFile).".manifest";

        $manifestPath = $this->accessDriver->urlBase.$manifestPath;
        $json = json_decode(file_get_contents($manifestPath));
        $json->manifest->status = self::PUBLISHED_STATUS;
        $json->manifest->lastpublished = date('c');
        $fp = fopen($manifestPath, "w");
        if($fp !== false){
            $json->manifest->lastupdated = date('c');
            if (!isset($json->manifest->is_a)){
                $json->manifest->is_a = $isRoot?'dco':'dro';
            }
            $data = json_encode($json);
            @fwrite($fp, $data, strlen($data));
            @fclose($fp);
        }
        //Create a published version of the meta
        copy($manifestPath, $manifestPath.".published");

        header('Content-Type: application/json; charset=UTF-8');
        header('Cache-Control: no-cache');
        $manifest = $json->manifest;
        $specs = (array)$this->loadSpecs();
        $type = array_key_exists($manifest->type, $specs) ? $specs[$manifest->type] : $manifest->type;
        $manifest->type_id = $manifest->type;
        $manifest->type = $type;
        $manifest->status_id = $manifest->status;
        $manifest->status = $this->mess["access_dco.".$manifest->status];
        print(json_encode($manifest));
    }

    private function hasChildElements($node){
        if (!$node->hasChildNodes()) return false;

        foreach ($node->childNodes as $child) {
            if ($child->nodeType == XML_ELEMENT_NODE) return true;            
        }
        return false;
    }

    private function parseMetaToJson($node){
        if ($this->hasChildElements($node)){
            $keys = array();

            if ($node->getAttribute('collection') === 'true' &&
                $node->getAttribute('fixed') === 'true'){
                $defaultString = $node->getAttribute('default');
                $default = array();
                if ($defaultString != null && $defaultString != ""){
                    $default = json_decode($defaultString);
                }
                foreach($default as $item){
                    $entry = array();
                    foreach(get_object_vars($item) as $key => $value){
                        $entry[$key] = $value->default;
                    }
                    $keys[] = $entry;
                }
                return $keys;
            }

            foreach ($node->childNodes as $childNode) {
                if ($childNode->nodeType == XML_TEXT_NODE) continue;
                if ($childNode->nodeType == XML_CDATA_SECTION_NODE) continue;
                $output = $this->parseMetaToJson($childNode);
                if ((is_array($output) && count($output) <= 0) ||
                    (is_string($output) && $output == null)
                    ){
                    continue; //Ignore empty results
                }
                $keys[$childNode->nodeName] = $output;
            }
            return $keys;
        }
        else {
            if ($node->hasAttribute("enabled") && $node->attributes["enabled"]->nodeValue){
                $output = ($node->hasAttribute("defaultValue") ? $node->getAttribute("defaultValue") : "");
            }
            else
                $output = null;
        }
        return $output;
    }

    /* DcoSpecProvider Implementation */
    public function loadSpecs(){
        $specsPath = APP_DATA_PATH."/plugins/meta.lom/specs";

        if (!is_dir($specsPath)){
            mkdir($specsPath, 0755, true);
        }

        $list = new \stdClass();

        foreach(glob($specsPath."/*.xml") as $file){
            $xml = new \DOMDocument();
            $xml->load($file);
            $xpath = new \DOMXPath($xml);

            $id = $xpath->query("/spec/id");
            $name = $xpath->query("/spec/name");
            $list->{$id[0]->nodeValue} = $name[0]->nodeValue;
        }
        return $list;
    }
    
    public function getSpecById($id, $print=true){
        $specsPath = APP_DATA_PATH."/plugins/meta.lom/specs";

        if ($id === 'DIGITAL_RESOURCE_OBJECT') {
            $id = $this->options["dro_spec"];
        }

        $found = glob($specsPath."/".$id.".xml");
        if (count($found) > 0){
            $xml = new \DOMDocument();
            $xml->load($found[0]);
            if ($print){
                header('Content-Type: text/xml; charset=UTF-8');
                header('Cache-Control: no-cache');
                print ($xml->saveXML());
                return false;
            }
            return $xml;
        }
        return false;
    }

    public function initMetaFromSpec($dir, $specId){
        //Create metadata file based on specs defaults
        $spec = $this->getSpecById($specId, false);
        if (false === $spec){
            throw new \Exception("Unable to find DCO specification '{$specId}'");
        }
        $xpath = new \DOMXPath($spec);
        $fields = $xpath->query("/spec/fields");

        if ($fields == null) {
            throw new \Exception('Unable to load metadata setup');
        }

        $fields = $fields->item(0);
        $meta = $this->parseMetaToJson($fields);
        return $meta;
        //$error = $this->accessDriver->createEmptyFile($dir, "/.metadata", json_encode($meta));
        //if(isSet($error)){
        //    throw new ApplicationException($error);
        //}
    }

    public function getMetaEditorClass(){
        return "LomMetaEditor";
    }

}
