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
 * The latest code can be found at <http://www.ajaxplorer.info/>.
 *
 * This is the main configuration file for configuring the core of the application.
 * In a standard usage, you should not have to change any variables.
 */
if(function_exists("date_default_timezone_set") and function_exists("date_default_timezone_get")){
	@date_default_timezone_set(@date_default_timezone_get());
}
if(function_exists("xdebug_disable")){
	xdebug_disable();
}
@error_reporting(E_ALL & ~E_NOTICE & ~E_STRICT);
//Windows users may have to uncomment this
//setlocale(LC_ALL, '');


list($vNmber,$vDate) = explode("__",file_get_contents(BOA_CONF_PATH."/VERSION"));

define("BOA_VERSION", $vNmber);
define("BOA_VERSION_DATE", $vDate);
define("BOA_EXEC", true);

// APPLICATION PATHES CONFIGURATION
define("BOA_DATA_PATH", BOA_INSTALL_PATH."/data");
define("BOA_CACHE_DIR", BOA_DATA_PATH."/cache");
define("BOA_SHARED_CACHE_DIR", BOA_INSTALL_PATH."/data/cache");
define("BOA_PLUGINS_CACHE_FILE", BOA_CACHE_DIR."/plugins_cache.ser");
define("BOA_PLUGINS_REQUIRES_FILE", BOA_CACHE_DIR."/plugins_requires.ser");
define("BOA_PLUGINS_QUERIES_CACHE", BOA_CACHE_DIR."/plugins_queries.ser");
define("BOA_PLUGINS_MESSAGES_FILE", BOA_CACHE_DIR."/plugins_messages.ser");
define("BOA_SERVER_ACCESS", "index.php");
define("BOA_PLUGINS_FOLDER", BOA_INSTALL_PATH."/boa/plugins");
define("BOA_PLUGINS_FOLDER_REL", "boa/plugins");
define("BOA_BIN_FOLDER", BOA_INSTALL_PATH."/boa/src");
define("BOA_BIN_FOLDER_REL", "boa/src");
define("BOA_DOCS_FOLDER", BOA_INSTALL_PATH."/boa/docs");
define("BOA_COREI18N_FOLDER", BOA_PLUGINS_FOLDER."/core.boa/i18n");
define("TESTS_RESULT_FILE", BOA_CACHE_DIR."/diag_result.php");
define("BOA_TESTS_FOLDER", BOA_INSTALL_PATH."/boa/tests");
define("INITIAL_ADMIN_PASSWORD", "admin");
define("SOFTWARE_UPDATE_SITE", "https://github.com/boa-project");
// Startup admin password (used at first creation). Once
// The admin password is created and his password is changed,
// this config has no more impact.
define("ADMIN_PASSWORD", "admin");
// For a specific distribution, you can specify where the
// log files will be stored. This should be detected by log.* plugins
// and used if defined. See bootstrap_plugins.php default configs for
// example in log.serial. Do not forget the trailing slash
// define("BOA_FORCE_LOGPATH", "/var/log/ajaxplorer/");
// DEBUG OPTIONS
define("BOA_CLIENT_DEBUG"  ,   true);
define("BOA_SERVER_DEBUG"  ,   false);
define("BOA_SKIP_CACHE"    ,   true);

//require(BOA_BIN_FOLDER."/compat.php");
function BoA_autoload($className){    
    //Core Classes
    $className = str_replace('\\', '/', $className);
    $lClassName = preg_replace('/^BoA\//', '', $className);
    $fileName = BOA_BIN_FOLDER."/".$lClassName.".class.php";
    if(file_exists($fileName)){
        require_once($fileName);
        return;
    }
    //Core interfaces    
    $fileName = BOA_BIN_FOLDER."/".$lClassName.".interface.php";
    if(file_exists($fileName)){
        require_once($fileName);
        return;
    }
    
    //Core Plugin Classes
    if (preg_match('/^BoA\/Plugins\/Core/', $className)){
        $lClassName = end(explode('/', $className));
        //Try class
        $corePlugClass = glob(BOA_PLUGINS_FOLDER."/core.*/".$lClassName.".class.php", GLOB_NOSORT);
        if($corePlugClass !== false && count($corePlugClass)){
            require_once($corePlugClass[0]);
            return;
        }
        //Try interface
        $corePlugInterface = glob(BOA_PLUGINS_FOLDER."/core.*/".$lClassName.".interface.php", GLOB_NOSORT);
        if($corePlugInterface !== false && count($corePlugInterface)){
            require_once($corePlugInterface[0]);
            return;
        }
    }
}

spl_autoload_register('BoA_autoload');

use BoA\Core\Utils\Utils;

Utils::safeIniSet("session.cookie_httponly", 1);

if(is_file(BOA_CONF_PATH."/bootstrap_conf.php")){
    include(BOA_CONF_PATH."/bootstrap_conf.php");
    if(isSet($BOA_INISET)){
        foreach($BOA_INISET as $key => $value) Utils::safeIniSet($key, $value);
    }
    if(defined('BOA_LOCALE')){
        setlocale(LC_ALL, BOA_LOCALE);
    }
}
