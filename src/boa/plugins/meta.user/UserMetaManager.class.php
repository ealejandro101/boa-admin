<?php
/*
 * Copyright 2007-2011 Charles du Jeu <contact (at) cdujeu.me>
 * This file is part of AjaXplorer.
 *
 * AjaXplorer is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * AjaXplorer is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with AjaXplorer.  If not, see <http://www.gnu.org/licenses/>.
 *
 * The latest code can be found at <http://www.ajaxplorer.info/>.
 */
namespace BoA\Plugins\Meta\User;

use BoA\Core\Access\UserSelection;
use BoA\Core\Http\Controller;
use BoA\Core\Http\XMLWriter;
use BoA\Core\Plugins\Plugin;
use BoA\Core\Services\AuthService;
use BoA\Core\Services\PluginsService;
use BoA\Core\Utils\Utils;
use BoA\Core\Xml\ManifestNode;

defined('BOA_EXEC') or die( 'Access not allowed');

/**
 * Simple metadata implementation, stored in hidden files inside the
 * folders
 * @package AjaXplorer_Plugins
 * @subpackage Meta
 */
class UserMetaManager extends Plugin {

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
            throw new Exception("The 'meta.user' plugin requires at least one active 'metastore' plugin");
        }
        $this->metaStore = $store;
        $this->metaStore->initMeta($accessDriver);

		//$messages = ConfService::getMessages();
		$def = $this->getMetaDefinition();
        if(!isSet($this->options["meta_visibility"])) $visibilities = array("visible");
        else $visibilities = explode(",", $this->options["meta_visibility"]);
		$cdataHead = '<div>
						<div class="panelHeader infoPanelGroup" colspan="2"><span class="icon-edit" data-ajxpAction="edit_user_meta" title="BOA_MESSAGE[meta.user.1]"></span>BOA_MESSAGE[meta.user.1]</div>
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
			$contrib->setAttribute("modifier", "MetaCellRenderer.prototype.infoPanelModifier");
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
            if(preg_match('/^meta_fields_(.*)$/', $key, $matches) != 0){
                $repIndex = $matches[1];
                $this->options["meta_fields"].=",".$val;
                $this->options["meta_labels"].=",".$this->options["meta_labels_".$repIndex];
                if(isSet($this->options["meta_visibility_".$repIndex]) && isSet($this->options["meta_visibility"])){
                    $this->options["meta_visibility"].=",".$this->options["meta_visibility_".$repIndex];
                }
            }
        }

		$fields = $this->options["meta_fields"];
		$arrF = explode(",", $fields);
		$labels = $this->options["meta_labels"];
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
	
	public function editMeta($actionName, $httpVars, $fileVars){
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
                    $original = $node->retrieveMetadata("users_meta", false, BOA_METADATA_SCOPE_GLOBAL);
				}
				if(isSet($original) && isset($original[$key])){
					$newValues[$key] = $original[$key];
				}
			}
		}		
    $node->setMetadata("users_meta", $newValues, false, BOA_METADATA_SCOPE_GLOBAL);
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

        //$metadata = $this->metaStore->retrieveMetadata($node, "users_meta", false, BOA_METADATA_SCOPE_GLOBAL);
        $metadata = $node->retrieveMetadata("users_meta", false, BOA_METADATA_SCOPE_GLOBAL);
        if(count($metadata)){
            // @todo : Should be UTF8-IZED at output only !!??
            // array_map(array("SystemTextEncoding", "toUTF8"), $metadata);
        }
        $metadata["meta_fields"] = $this->options["meta_fields"];
        $metadata["meta_labels"] = $this->options["meta_labels"];
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
		
		$oldMeta = $this->metaStore->retrieveMetadata($oldFile, "users_meta", false, BOA_METADATA_SCOPE_GLOBAL);
		if(!count($oldMeta)){
			return;
		}
		// If it's a move or a delete, delete old data
		if(!$copy){
            $this->metaStore->removeMetadata($oldFile, "users_meta", false, BOA_METADATA_SCOPE_GLOBAL);
		}
		// If copy or move, copy data.
		if($newFile != null){
            $this->metaStore->setMetadata($newFile, "users_meta", $oldMeta, false, BOA_METADATA_SCOPE_GLOBAL);
		}
	}
	
}

?>