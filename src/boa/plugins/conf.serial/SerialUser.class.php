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
namespace BoA\Plugins\Conf\Serial;

use BoA\Core\Services\AuthService;
use BoA\Core\Services\ConfService;
use BoA\Core\Utils\Utils;
use BoA\Core\Utils\Filters\VarsFilter;
use BoA\Plugins\Core\Conf\AbstractUser;

defined('BOA_EXEC') or die( 'Access not allowed');

/**
 * Implementation of the AbstractUser for serial
 * @package AjaXplorer_Plugins
 * @subpackage Conf
 */
class SerialUser extends AbstractUser
{
	var $id;
	var $hasAdmin = false;
	var $rights;
	var $prefs;
	var $bookmarks;
	var $version;
	
	/**
	 * Conf Storage implementation
	 *
	 * @var AbstractConfDriver
	 */
	var $storage;
	var $registerForSave = array();
    var $create = true;

    var $childrenPointer = null;

    /**
     * @param $id
     * @param serialConfDriver $storage
     */
    function __construct($id, $storage=null){
		parent::__construct($id, $storage);
        $this->registerForSave = array();
    }

    function setGroupPath($groupPath, $update = false){
        if($update && isSet($this->groupPath) && $this->groupPath != $groupPath){
            $children = $this->getChildrenPointer();
            if(is_array($children)){
                foreach($children as $userId){
                    // UPDATE USER GROUP AND ROLES
                    $u = ConfService::getConfStorageImpl()->createUserObject($userId);
                    $u->setGroupPath($groupPath);
                    $r = $u->getRoles();
                    // REMOVE OLD GROUP ROLES
                    foreach(array_keys($r) as $role){
                        if(strpos($role, "BOA_GRP_/") === 0) $u->removeRole($role);
                    }
                    $u->recomputeMergedRole();
                    $u->save("superuser");
                }
            }
        }
        parent::setGroupPath($groupPath);
        $groups = Utils::loadSerialFile(VarsFilter::filter($this->storage->getOption("USERS_DIRPATH"))."/groups.ser");
        $groups[$this->getId()] = $groupPath;
        Utils::saveSerialFile(VarsFilter::filter($this->storage->getOption("USERS_DIRPATH"))."/groups.ser", $groups);
    }

    function __wakeup(){
        $this->registerForSave = array();
    }

    public function getStoragePath(){
        $subDir = trim($this->getGroupPath(), "/");
        $id = $this->getId();
        if(AuthService::ignoreUserCase()) $id = strtolower($id);
        $res = VarsFilter::filter($this->storage->getOption("USERS_DIRPATH"))."/".(empty($subDir)?"":$subDir."/").$id;
        return $res;
    }

	function storageExists(){
        return is_dir($this->getStoragePath());
	}

	function load(){
        $groups = Utils::loadSerialFile(VarsFilter::filter($this->storage->getOption("USERS_DIRPATH"))."/groups.ser");
        if(isSet($groups[$this->getId()])) $this->groupPath = $groups[$this->getId()];

        $this->create = false;
        $this->rights = Utils::loadSerialFile($this->getStoragePath()."/rights.ser");
        if(count($this->rights) == 0) $this->create = true;
		$this->prefs = Utils::loadSerialFile($this->getStoragePath()."/prefs.ser");
		$this->bookmarks = Utils::loadSerialFile($this->getStoragePath()."/bookmarks.ser");
		if(isSet($this->rights["app.admin"]) && $this->rights["app.admin"] === true){
			$this->setAdmin(true);
		}
		if(isSet($this->rights["app.parent_user"])){
			//$this->setParent($this->rights["app.parent_user"]);
            parent::setParent($this->rights["app.parent_user"]);
		}
        if(isSet($this->rights["app.group_path"])){
            $this->setGroupPath($this->rights["app.group_path"]);
        }
        if(isSet($this->rights["app.children_pointer"])){
            $this->childrenPointer = $this->rights["app.children_pointer"];
        }

        // LOAD ROLES
        $rolesToLoad = array();
        if(isSet($this->rights["app.roles"])) {
            $rolesToLoad = array_keys($this->rights["app.roles"]);
        }
        if($this->groupPath != null){
            $base = "";
            $exp = explode("/", $this->groupPath);
            foreach($exp as $pathPart){
                if(empty($pathPart)) continue;
                $base = $base . "/" . $pathPart;
                $rolesToLoad[] = "BOA_GRP_".$base;
            }
        }
		// Load roles
		if(count($rolesToLoad)){
            $allRoles = AuthService::getRolesList($rolesToLoad);
			foreach ($rolesToLoad as $roleId){
				if(isSet($allRoles[$roleId])){
					$this->roles[$roleId] = $allRoles[$roleId];
                    $this->rights["app.roles"][$roleId] = true;
				}else if(is_array($this->rights["app.roles"]) && isSet($this->rights["app.roles"][$roleId])){
					unset($this->rights["app.roles"][$roleId]);
				}
			}
		}

        // LOAD USR ROLE LOCALLY
        $personalRole = Utils::loadSerialFile($this->getStoragePath()."/role.ser");
        if(is_a($personalRole, "BoA\Core\Security\Role")){
            $this->personalRole = $personalRole;
            $this->roles["BOA_USR_"."/".$this->id] = $personalRole;
        }else{
            // MIGRATE NOW !
            $this->migrateRightsToPersonalRole();
            Utils::saveSerialFile($this->getStoragePath()."/role.ser", $this->personalRole, true);
            Utils::saveSerialFile($this->getStoragePath()."/rights.ser", $this->rights, true);
        }

        $this->recomputeMergedRole();
	}
	
	function save($context = "superuser"){
		if($this->isAdmin() === true){
			$this->rights["app.admin"] = true;
		}else{
			$this->rights["app.admin"] = false;
		}
		if($this->hasParent()){
			$this->rights["app.parent_user"] = $this->parentUser;
		}
        if(isSet($this->childrenPointer)){
            $this->rights["app.children_pointer"] = $this->childrenPointer;
        }
        $this->rights["app.group_path"] = $this->getGroupPath();

        if($context == "superuser"){
            $this->registerForSave["rights"] = true;
        }
        $this->registerForSave["prefs"] = true;
        $this->registerForSave["bookmarks"] = true;
	}

    function __destruct(){
        if(count($this->registerForSave)==0) return;
        $fastCheck = $this->storage->getOption("FAST_CHECKS");
        $fastCheck = ($fastCheck == "true" || $fastCheck == true);
        if(isSet($this->registerForSave["rights"]) || $this->create){
            $filteredRights = $this->rights;
            if(isSet($filteredRights["app.roles"])) $filteredRights["app.roles"] = $this->filterRolesForSaving($filteredRights["app.roles"]);
            Utils::saveSerialFile($this->getStoragePath()."/rights.ser", $this->rights, !$fastCheck);
            Utils::saveSerialFile($this->getStoragePath()."/role.ser", $this->personalRole, !$fastCheck);
        }
        if(isSet($this->registerForSave["prefs"])){
            Utils::saveSerialFile($this->getStoragePath()."/prefs.ser", $this->prefs, !$fastCheck);
        }
        if(isSet($this->registerForSave["bookmarks"])){
            Utils::saveSerialFile($this->getStoragePath()."/bookmarks.ser", $this->bookmarks, !$fastCheck);
        }
        $this->registerForSave = array();
    }
	
	function getTemporaryData($key){
        $fastCheck = $this->storage->getOption("FAST_CHECKS");
        $fastCheck = ($fastCheck == "true" || $fastCheck == true);
        return Utils::loadSerialFile($this->getStoragePath()."/".$key.".ser",$fastCheck);
	}
	
	function saveTemporaryData($key, $value){
        $fastCheck = $this->storage->getOption("FAST_CHECKS");
        $fastCheck = ($fastCheck == "true" || $fastCheck == true);
        return Utils::saveSerialFile($this->getStoragePath()."/".$key.".ser", $value, !$fastCheck);
	}

    /**
     * Override parent method to keep a reference to the child users
     * @param $parentId
     */
    function setParent($parentId){
        $u = ConfService::getConfStorageImpl()->createUserObject($parentId);
        $p = $u->getChildrenPointer();
        if($p == null) $p = array();
        $p[$this->getId()] = $this->getId();
        $u->setChildrenPointer($p);
        $u->save("superuser");
        if(AuthService::getLoggedUser() != null && AuthService::getLoggedUser()->getId() == $parentId){
            AuthService::updateUser($u);
        }
        parent::setParent($parentId);
    }

    /**
     * @return null|Array
     */
    function getChildrenPointer(){
        return $this->childrenPointer;
    }

    /**
     * @param Array $array
     */
    function setChildrenPointer($array){
        $this->childrenPointer = $array;
    }

}