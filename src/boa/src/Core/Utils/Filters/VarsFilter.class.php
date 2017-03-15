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
 * The latest code can be found at <http://https://github.com/boa-project/boa/>.
 */
namespace BoA\Core\Utils\Filters;

use BoA\Core\Http\Controller;
use BoA\Core\Services\AuthService;

defined('BOA_EXEC') or die( 'Access not allowed');

/**
 * Standard values filtering used in the core.
 * @static
 * @package AjaXplorer
 * @subpackage Core
 */
class VarsFilter {

    /**
     * Filter the very basic keywords from the XML  : BOA_USER, BOA_INSTALL_PATH, BOA_DATA_PATH
     * Calls the vars.filter hooks.
     * @static
     * @param $value
     * @return mixed|string
     */
	public static function filter($value){
		if(is_string($value) && strpos($value, "BOA_USER")!==false){
			if(AuthService::usersEnabled()){
				$loggedUser = AuthService::getLoggedUser();
				if($loggedUser != null){
                    if($loggedUser->hasParent() && $loggedUser->getResolveAsParent()){
                        $loggedUserId = $loggedUser->getParent();
                    }else{
                        $loggedUserId = $loggedUser->getId();
                    }
					$value = str_replace("BOA_USER", $loggedUserId, $value);
				}else{
					return "";
				}
			}else{
				$value = str_replace("BOA_USER", "shared", $value);
			}
		}
		if(is_string($value) && strpos($value, "BOA_GROUP_PATH")!==false){
			if(AuthService::usersEnabled()){
				$loggedUser = AuthService::getLoggedUser();
				if($loggedUser != null){
					$gPath = $loggedUser->getGroupPath();
                    $value = str_replace("BOA_GROUP_PATH_FLAT", str_replace("/", "_", trim($gPath, "/")), $value);
                    $value = str_replace("BOA_GROUP_PATH", $gPath, $value);
				}else{
					return "";
				}
			}else{
                $value = str_replace(array("BOA_GROUP_PATH", "BOA_GROUP_PATH_FLAT"), "shared", $value);
            }
		}
		if(is_string($value) && strpos($value, "BOA_INSTALL_PATH") !== false){
			$value = str_replace("BOA_INSTALL_PATH", BOA_INSTALL_PATH, $value);
		}
		if(is_string($value) && strpos($value, "BOA_DATA_PATH") !== false){
			$value = str_replace("BOA_DATA_PATH", BOA_DATA_PATH, $value);
		}
        $tab = array(&$value);
		Controller::applyIncludeHook("vars.filter", $tab);
		return $value;
	}
}
