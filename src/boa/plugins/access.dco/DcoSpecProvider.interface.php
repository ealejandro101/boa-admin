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

defined('APP_EXEC') or die( 'Access not allowed');

/**
 * Interface must be implemented for access drivers that can be accessed via a wrapper protocol.
 * @package BoA
 * @subpackage Core
 * @interface DcoSpecProvider
 */
interface DcoSpecProvider {

    /**
     * @return string
     */
    function loadSpecs();
    /**
     * Convert a path (from the repository root) to a fully 
     * qualified app url like app.protocol://repoId/path/to/node
     * @param String $path
     * @return String
     */
    function getSpecById($id, $print);
    
    /**
     * Creates a directory
     * @param String $path
     * @param String $newDirName
     */
    function defaultMetaFromSpec($node); 
    
    /**
     * Creates an empty file
     * @param String $path
     * @param String $newDirName
     */
    function getMetaEditorClass();

}

?>