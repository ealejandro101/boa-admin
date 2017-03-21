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
namespace BoA\Plugins\Core\Uploader;

use BoA\Core\Plugins\Plugin;
use BoA\Core\Utils\Utils;

defined('BOA_EXEC') or die( 'Access not allowed');

/**
 * Config loader overrider
 * @package BoA_Plugins
 * @subpackage Core
 */
class CoreUploaderLoader extends Plugin{

    public $AUTO_LOAD_TYPE = true;

    public function getConfigs(){
        $data = parent::getConfigs();
        $this->filterData($data);
        return $data;
    }
	public function loadConfigs($data){

        $this->filterData($data);
        parent::loadConfigs($data);

	}

	private function filterData(&$data){
        $confMaxSize = 0;
        if (isset($data["UPLOAD_MAX_SIZE"])) {
            $confMaxSize = Utils::convertBytes($data["UPLOAD_MAX_SIZE"]);
        }
        $UploadMaxSize = min(Utils::convertBytes(ini_get('upload_max_filesize')),
            Utils::convertBytes(ini_get('post_max_size')));
        
        if(intval($confMaxSize) != 0) {
            $UploadMaxSize = min ($UploadMaxSize, $confMaxSize);
        }
        $data["UPLOAD_MAX_SIZE"] = $UploadMaxSize;

    }
}