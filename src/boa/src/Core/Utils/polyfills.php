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
 *
 * Various functions definitions when they are not existing in the current
 * PHP installation
 */


if ( !function_exists('sys_get_temp_dir')) {
    function sys_get_temp_dir() {
        if( $temp=getenv('TMP') )        return $temp;
        if( $temp=getenv('TEMP') )        return $temp;
        if( $temp=getenv('TMPDIR') )    return $temp;
        $temp=tempnam(__FILE__,'');
        if (file_exists($temp)) {
            unlink($temp);
            return dirname($temp);
        }
        return null;
    }
}

if(!function_exists('json_encode')){
    
    function json_encode($val){
        // indexed array
        if (is_array($val) && (!$val
            || array_keys($val) === range(0, count($val) - 1))) {
            return '[' . implode(',', array_map('json_encode', $val)) . ']';
        }

        // associative array
        if (is_array($val) || is_object($val)) {
            $tmp = array();
            foreach ($val as $k => $v) {
                $tmp[] = json_encode((string) $k) . ':' . json_encode($v);
            }
            return '{' . implode(',', $tmp) . '}';
        }

        if (is_string($val)) {
            $val = str_replace(array("\\", "\x00"), array("\\\\", "\\u0000"), $val); // due to bug #40915
            return '"' . addcslashes($val, "\x8\x9\xA\xC\xD/\"") . '"';
        }

        if (is_int($val) || is_float($val)) {
            return rtrim(rtrim(number_format($val, 5, '.', ''), '0'), '.');
        }

        if (is_bool($val)) {
            return $val ? 'true' : 'false';
        }

        return 'null';
    }
    
    
}

if (!function_exists('glob_recursive')){
    // Does not support flag GLOB_BRACE
    function glob_recursive($pattern, $flags = 0){
        $files = glob($pattern, $flags);
        foreach (glob(dirname($pattern).'/*', GLOB_ONLYDIR|GLOB_NOSORT) as $dir){
            $files = array_merge($files, glob_recursive($dir.'/'.basename($pattern), $flags));
        }
        return $files;
    }
}


if (!function_exists('json_decode') ){
    function json_decode($json, $opt=null){
        // Author: walidator.info 2009
        $comment = false;
        $out = '$x=';

        for ($i=0; $i<strlen($json); $i++){
            if (!$comment){
                if ($json[$i] == '{')        $out .= ' array(';
                else if ($json[$i] == '}')    $out .= ')';
                else if ($json[$i] == '[')    $out .= 'array(';
                else if ($json[$i] == ']')    $out .= ')';
                else if ($json[$i] == ':')    $out .= '=>';
                else                         $out .= $json[$i];
            }
            else $out .= $json[$i];
            if ($json[$i] == '"')    $comment = !$comment;
        }
        eval($out . ';');
        return $x;
    }
}

if (!class_exists('DateTime')){
    class DateTime {
        public $date;
        
        public function __construct($date){
            $this->date = strtotime($date);
        }
        
        public function setTimeZone($timezone){
            return;
        }
        
        private function __getDate(){
            return date(DATE_ATOM, $this->date);    
        }
        
        public function modify($multiplier){
            $this->date = strtotime($this->__getDate() . ' ' . $multiplier);
        }
        
        public function format($format){
            return date($format, $this->date);
        }
    }
}

function GUID(){
    if (function_exists('com_create_guid') === true){
        return trim(com_create_guid(), '{}');
    }

    return sprintf('%04X%04X-%04X-%04X-%04X-%04X%04X%04X', mt_rand(0, 65535), mt_rand(0, 65535), mt_rand(0, 65535), mt_rand(16384, 20479), mt_rand(32768, 49151), mt_rand(0, 65535), mt_rand(0, 65535), mt_rand(0, 65535));
}

