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
 * @package    [PACKAGE]
 * @category   [CATEGORY]
 * @copyright  2017 BoA Project
 * @license    https://www.gnu.org/licenses/agpl-3.0.html GNU Affero GPL v3 or later
 */
namespace BoA\Plugins\Meta\Lom;

use BoA\Core\Access\UserSelection;
use BoA\Core\Http\Controller;
use BoA\Core\Http\XMLWriter;
use BoA\Core\Plugins\Plugin;
use BoA\Core\Services\AuthService;
use BoA\Core\Services\PluginsService;
use BoA\Core\Utils\Utils;
use BoA\Core\Xml\ManifestNode;

defined('APP_EXEC') or die( 'Access not allowed');

/**
 * Simple metadata implementation, stored in hidden files inside the
 * folders
 * @package APP_Plugins
 * @subpackage Meta
 */
class LomMetaManager extends Plugin {

    /**
     * @var AbstractAccessDriver
     */
    protected $accessDriver;
    /**
     * @var MetaStoreProvider
     */
    protected $metaStore;

    public function init($options){
        $this->options = $options;
        // Do nothing
    }

    public function initMeta($accessDriver){
        $this->accessDriver = $accessDriver;

        $store = PluginsService::getInstance()->getUniqueActivePluginForType("metastore");
        if($store === false){
                throw new \Exception("The 'meta.lom' plugin requires at least one active 'metastore' plugin");
        }
        $this->metaStore = $store;
        $this->metaStore->initMeta($accessDriver);

        //$messages = ConfService::getMessages();
        $def = $this->getMetaDefinition();
        if(!isSet($this->options["meta_visibility"])) $visibilities = array("visible");
        else $visibilities = explode(",", $this->options["meta_visibility"]);
        $cdataHead = '<div>
                        <div class="panelHeader infoPanelGroup" colspan="2"><span class="icon-edit" data-action="edit_lom_meta" title="APP_MESSAGE[meta.lom.1]"></span>APP_MESSAGE[meta.lom.1]</div>
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
        }
        
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

        parent::init($this->options);
    
    }
        
    protected function getMetaDefinition(){
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
        return $result;   
    }
    
    public function editLomMeta($actionName, $httpVars, $fileVars){
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
        $node = new ManifestNode($urlBase);


        $newValues = array();
        $def = $this->getMetaDefinition();
        $node->setDriver($this->accessDriver);
        Controller::applyHook("node.before_change", array(&$node));
        foreach ($def as $key => $label){
            if(isSet($httpVars[$key])){
                $newValues[$key] = Utils::decodeSecureMagic($httpVars[$key]);
            }else{
                if(!isset($original)){
                    $original = $node->retrieveMetadata("lom_meta", false, APP_METADATA_SCOPE_GLOBAL);
                }
                if(isSet($original) && isset($original[$key])){
                    $newValues[$key] = $original[$key];
                }
            }
        }  
        $node->setMetadata("lom_meta", $newValues, false, APP_METADATA_SCOPE_GLOBAL);
        Controller::applyHook("node.meta_change", array($node));
        XMLWriter::header();
        XMLWriter::writeNodesDiff(array("UPDATE" => array($node->getPath() => $node)), true);
        XMLWriter::close();
    }

    /**
     *
     * @param ManifestNode $node
     * @param bool $contextNode
     * @param bool $details
     * @return void
     */
    public function extractMeta(&$node, $contextNode = false, $details = false){

        //$metadata = $this->metaStore->retrieveMetadata($node, "loms_meta", false, APP_METADATA_SCOPE_GLOBAL);
        //echo 'Getting meta for lom';
        $metadata = $node->retrieveMetadata("lom_meta", false, APP_METADATA_SCOPE_GLOBAL);
        if(count($metadata)){
            // @todo : Should be UTF8-IZED at output only !!??
            // array_map(array("SystemTextEncoding", "toUTF8"), $metadata);
        }
        $metadata["lom_meta_fields"] = $this->options["lom_meta_fields"];
        $metadata["lom_meta_labels"] = $this->options["lom_meta_labels"];

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
        
        XMLWriter::header("output");
        switch ($action) {
            case 'get_specs_list':
                $this->loadSpecs();
                break;
            
            case 'mkdco':
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
                break;

            default:
                # code...
                break;
        }
        XMLWriter::close("output");

    }

    private function loadSpecs(){
        $specsPath = APP_DATA_PATH."/plugins/lom.meta/specs";

        if (!is_dir($specsPath)){
            mkdir($specsPath, 0755, true);
        }

        foreach(glob($specsPath."/*.xml") as $file){
            $xml = new \DOMDocument();
            $xml->load($file);
            $xpath = new \DOMXPath($xml);

            $id = $xpath->query("/spec/id");
            $name = $xpath->query("/spec/name");
            print("<spec name=\"".$name[0]->nodeValue."\" id=\"".$id[0]->nodeValue."\" path=\"".basename($file)."\"/>");
        }
    }
}
