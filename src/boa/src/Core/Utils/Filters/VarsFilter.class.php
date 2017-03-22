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
namespace BoA\Core\Utils\Filters;

use BoA\Core\Http\Controller;
use BoA\Core\Services\AuthService;

defined('APP_EXEC') or die( 'Access not allowed');

/**
 * Standard values filtering used in the core.
 * @static
 * @package BoA
 * @subpackage Core
 */
class VarsFilter {

    /**
     * Filter the very basic keywords from the XML  : APP_USER, APP_INSTALL_PATH, APP_DATA_PATH
     * Calls the vars.filter hooks.
     * @static
     * @param $value
     * @return mixed|string
     */
	public static function filter($value){
		if(is_string($value) && strpos($value, "APP_USER")!==false){
			if(AuthService::usersEnabled()){
				$loggedUser = AuthService::getLoggedUser();
				if($loggedUser != null){
                    if($loggedUser->hasParent() && $loggedUser->getResolveAsParent()){
                        $loggedUserId = $loggedUser->getParent();
                    }else{
                        $loggedUserId = $loggedUser->getId();
                    }
					$value = str_replace("APP_USER", $loggedUserId, $value);
				}else{
					return "";
				}
			}else{
				$value = str_replace("APP_USER", "shared", $value);
			}
		}
		if(is_string($value) && strpos($value, "APP_GROUP_PATH")!==false){
			if(AuthService::usersEnabled()){
				$loggedUser = AuthService::getLoggedUser();
				if($loggedUser != null){
					$gPath = $loggedUser->getGroupPath();
                    $value = str_replace("APP_GROUP_PATH_FLAT", str_replace("/", "_", trim($gPath, "/")), $value);
                    $value = str_replace("APP_GROUP_PATH", $gPath, $value);
				}else{
					return "";
				}
			}else{
                $value = str_replace(array("APP_GROUP_PATH", "APP_GROUP_PATH_FLAT"), "shared", $value);
            }
		}
		if(is_string($value) && strpos($value, "APP_INSTALL_PATH") !== false){
			$value = str_replace("APP_INSTALL_PATH", APP_INSTALL_PATH, $value);
		}
		if(is_string($value) && strpos($value, "APP_DATA_PATH") !== false){
			$value = str_replace("APP_DATA_PATH", APP_DATA_PATH, $value);
		}
        $tab = array(&$value);
		Controller::applyIncludeHook("vars.filter", $tab);
		return $value;
	}
}
