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
namespace BoA\Plugins\Access\Dco;

use BoA\Core\Diagnostics\AbstractTest;

defined('APP_EXEC') or die( 'Access not allowed');

/**
 * @package APP_Plugins
 * @subpackage Access
 */
class DcoAccessTest extends AbstractTest
{
    function DcoAccessTest() { parent::AbstractTest("Filesystem Plugin", ""); }

    /**
     * Test Repository
     *
     * @param Repository $repo
     * @return Boolean
     */
    function doRepositoryTest($repo){
        if ($repo->accessType != 'dco' ) return -1;
        // Check the destination path
        $this->failedInfo = "";
        $path = $repo->getOption("PATH", false);
        $createOpt = $repo->getOption("CREATE");
        $create = (($createOpt=="true"||$createOpt===true)?true:false);
        if(strstr($path, "APP_USER")!==false) return TRUE; // CANNOT TEST THIS CASE!        
        if (!$create && !@is_dir($path))
        { 
        	$this->failedInfo .= "Selected repository path ".$path." doesn't exist, and the CREATE option is false"; return FALSE; 
        }
        else if (!$create && !is_writeable($path))
        { $this->failedInfo .= "Selected repository path ".$path." isn't writeable"; return FALSE; }
        // Do more tests here  
        return TRUE;    	
    }
    
};

?>
