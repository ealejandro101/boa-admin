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
namespace BoA\Core\Exceptions;

use BoA\Core\Services\ConfService;

defined('APP_EXEC') or die( 'Access not allowed');
/**
 * Custom exception (legacy from php4 when there were no exceptions)
 * @package BoA
 * @subpackage Core
 */
class ApplicationException extends \Exception {
	
	function __construct($messageString, $messageId = false){
		if($messageId !== false && class_exists("BoA\Core\Services\ConfService")){
			$messages = ConfService::getMessages();
			if(array_key_exists($messageId, $messages)){
				$messageString = $messages[$messageId];
			}else{
				$messageString = $messageId;
			}
		}
		parent::__construct($messageString);
	}
		
	function errorToXml($mixed)
	{
		if(is_a($mixed, "Exception")){
			throw $this;
		}else{
			throw new ApplicationException($mixed);
		}
	}
}
