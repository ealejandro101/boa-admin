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
namespace BoA\Core\Diagnostics;

defined('BOA_EXEC') or die( 'Access not allowed');

global $MAIN_testsArray;
/**
 * Abstract test class
 * Abstract class for diagnostic tests. These tests are run at the first application start up, and their
 * results are displayed in the Diagnostic page. It's possible to re-run the full diagnostic by calling
 * the runTests.php script (first line needs to be commented first).
 * @package BoA
 * @subpackage Core
 */
class AbstractTest
{
    /** The test name */
    var $name;
    /** The test information when failed */
    var $failedInfo;
    /** The test results output (used for report) */
    var $resultOutput;
    /** Tested params - When used as a diagnostic tool, can store variables used by the test*/
    var $testedParas;
    /** The test level when failed (warning, info or error, default to error) */
    var $failedLevel;
    /** The test parameters */
    var $params;
    
    function __construct($name, $failedInfo, $params = NULL) 
    {
        $this->name = $name;
        $this->failedInfo = $failedInfo;
        $this->params = $params;
        $this->failedLevel = "error";
        $this->testedParams = array();
        global $MAIN_testsArray;
        $MAIN_testsArray[] = $this;
    }
    
    /**
     * Perform the test, should be overwritten in concrete classes
     * @abstract
     * @return Boolean
     */
    function doTest() { return FALSE; }
    
    /** 
     * Perform the test on a given repository object, should be overwritten in concrete classes 
     * @param Repository $repository
     * @return Boolean
     */
    function doRepositoryTest($repository) { return FALSE; }
    
    /**
     * Utilitary to convert php config to numerical values.
     *
     * @param String $val
     * @return Integer
     */
    function returnBytes($val) {
    	$val = trim($val);
    	$last = strtolower($val[strlen($val)-1]);
    	switch($last) {
    		// Le modifieur 'G' est disponible depuis PHP 5.1.0
    		case 'g':
    			$val *= 1024;
    		case 'm':
    			$val *= 1024;
    		case 'k':
    			$val *= 1024;
    	}

    	return $val;
    }
};

?>