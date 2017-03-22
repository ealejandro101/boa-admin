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
namespace BoA\Plugins\Action\Share;

use BoA\Core\Services\ConfService;
use BoA\Core\Utils\Utils;

defined('APP_EXEC') or die( 'Access not allowed');

/**
 * Download counter for publiclets
 * @package AjaXplorer_Plugins
 * @subpackage Action
 */
class PublicletCounter {
	
	static private $counters;
	
	static function getCount($publiclet){
		$counters = self::loadCounters();
		if(isSet($counters[$publiclet])) return $counters[$publiclet];
		return 0;
	}
	
	static function increment($publiclet){
		if(!self::isActive()) return -1 ;
		$counters = self::loadCounters();
		if(!isSet($counters[$publiclet])){
			$counters[$publiclet]  = 0;
		}
		$counters[$publiclet] ++;
		self::saveCounters($counters);
		return $counters[$publiclet];
	}
	
	static function reset($publiclet){
		if(!self::isActive()) return -1 ;
		$counters = self::loadCounters();
		$counters[$publiclet]  = 0;
		self::saveCounters($counters);
	}
	
	static function delete($publiclet){
		if(!self::isActive()) return -1 ;
		$counters = self::loadCounters();
		if(isSet($counters[$publiclet])){
			unset($counters[$publiclet]);
			self::saveCounters($counters);
		}
	}
	
	static private function isActive(){
		return (is_dir(ConfService::getCoreConf("PUBLIC_DOWNLOAD_FOLDER")) && is_writable(ConfService::getCoreConf("PUBLIC_DOWNLOAD_FOLDER")));
	}
	
	static private function loadCounters(){
		if(!isSet(self::$counters)){
			self::$counters = Utils::loadSerialFile(ConfService::getCoreConf("PUBLIC_DOWNLOAD_FOLDER")."/.publiclet_counters.ser");			
		}
		return self::$counters;
	}
	
	static private function saveCounters($counters){
		self::$counters = $counters;
		Utils::saveSerialFile(ConfService::getCoreConf("PUBLIC_DOWNLOAD_FOLDER")."/.publiclet_counters.ser", $counters, false);
	}
	
}
?>