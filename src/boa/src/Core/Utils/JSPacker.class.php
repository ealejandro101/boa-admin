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
namespace BoA\Core\Utils;

use BoA\Core\Services\PluginsService;

defined('BOA_EXEC') or die( 'Access not allowed');

/**
 * Encapsulation of the javascript/css packing library
 * @package AjaXplorer
 * @subpackage Core
 */
class JSPacker{
	
	/**
	 * Static function for packing all js and css into big files
     * Auto detect /js/*_list.txt files and /css/*_list.txt files and pack them.
	 */
	function pack(){
        // Make sure that the gui.* plugin is loaded
        $plug = PluginsService::getInstance()->getPluginsByType("gui");

        $sList = glob(CLIENT_RESOURCES_FOLDER."/js/*_list.txt");
        foreach ($sList as $list){
            $scriptName = str_replace("_list.txt", ".js", $list);
            JSPacker::concatListAndPack($list,
                                             $scriptName,
                                            "Normal");
        }

        $sList = glob(BOA_THEME_FOLDER."/css/*_list.txt");
        foreach ($sList as $list){
            $scriptName = str_replace("_list.txt", ".css", $list);
            JSPacker::concatListAndPack($list,
                                             $scriptName,
                                            "None");
        }
	}

    /**
     * Perform actual compression
     * @param $src
     * @param $out
     * @param $mode
     * @return bool
     */
	function concatListAndPack($src, $out, $mode){
		if(!is_file($src) || !is_readable($src)){
			return false;
		}
		
		// Concat List into one big string	
		$jscode = '' ;
		$handle = @fopen($src, 'r');
		if ($handle) {
		    while (!feof($handle)) {
		        $jsline = fgets($handle, 4096) ;
		        if(rtrim($jsline,"\n") != ""){
					$code = file_get_contents(BOA_INSTALL_PATH."/".CLIENT_RESOURCES_FOLDER."/".rtrim($jsline,"\n\r")) ;
					if ($code) $jscode .= $code ;
		        }
		    }
		    fclose($handle);
		}
		
		// Pack and write to file
		require_once(BOA_VENDOR_FOLDER."/packer/class.JavaScriptPacker.php");
		$packer = new \JavaScriptPacker($jscode, $mode , true, false);
		$packed = $packer->pack();
		if($mode == "None"){ // css case, hack for I.E.
			$packed = str_replace("solid#", "solid #", $packed);
		}

		@file_put_contents($out, $packed);
		
		return true;
	}
	
}

?>