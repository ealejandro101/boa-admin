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
$mess=array(
"File System (Standard)" => "File System (Standard)",
"The most standard access to a filesystem located on the server." => "The most standard access to a filesystem located on the server.",
"Path" => "Path",
"Real path to the root folder on the server" => "Real path to the root folder on the server",
"Create" => "Create",
"Create folder if it does not exists" => "Create folder if it does not exists",
"File Creation Mask" => "File Creation Mask",
"Optionnaly apply a chmod operation. Value must be numeric, like 0777, 0644, etc." => "Optionnaly apply a chmod operation. Value must be numeric, like 0777, 0644, etc.",
"Purge Days" => "Purge Days",
"Option to purge documents after a given number of days. This require a manual set up of a CRON task. Leave to 0 if you don't wan't to use this feature." => "Option to purge documents after a given number of days. This require a manual set up of a CRON task. Leave to 0 if you don't wan't to use this feature.",
"Real Size Probing" => "Real Size Probing",
"Use system command line to get the filesize instead of php built-in function (fixes the 2Go limitation)" => "Use system command line to get the filesize instead of php built-in function (fixes the 2Go limitation)",
"X-SendFile Active" => "X-SendFile Active",
"Delegates all download operations to the webserver using the X-SendFile header. Warning, this is an external module to install for Apache. Module is active by default in Lighttpd. Warning, you have to manually add the folders where files will be downloaded in the module configuration (XSendFilePath directive)" => "Delegates all download operations to the webserver using the X-SendFile header. Warning, this is an external module to install for Apache. Module is active by default in Lighttpd. Warning, you have to manually add the folders where files will be downloaded in the module configuration (XSendFilePath directive)",
"Data template" => "Data template",
"Path to a directory on the filesystem whose content will be copied to the repository the first time it is loaded." => "Path to a directory on the filesystem whose content will be copied to the workspace the first time it is loaded."
);