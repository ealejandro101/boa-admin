<?php

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

  

function join_files($pathtype, $filepath){
  $dir = dirname($filepath);
  $manifestpath = $pathtype == 1 ? $filepath : str_replace(".metadata", ".manifest", $filepath);
  $metadatapath = $pathtype == 2 ? $filepath : $dir . "/.metadata";
  $metadatacontent = file_exists($metadatapath) ? file_get_contents($metadatapath) : "{}";
  $manifestcontent = file_exists($manifestpath) ? file_get_contents($manifestpath) : "{}";
  $merge = new stdClass();
  $merge->manifest = json_decode($manifestcontent);
  //Check manifest file has not been already fixed
  if (isset($merge->manifest) && (isset($merge->manifest->manifest) || isset($merge->manifest->metadata))){ 
    return;
  }
  $merge->metadata = json_decode($metadatacontent);
  $data = json_encode($merge);
  $fp = fopen($manifestpath, "w");
  @fwrite($fp, $data, strlen($data));
  @fclose($fp);
  chown($manifestpath, WWW_USER);
  if (file_exists($manifestpath.".test"))
    unlink($manifestpath.".test");
}


define("WWW_USER", "www-data"); //Set this value to the web/apache user

array_shift($argv);
foreach ($argv as $path) {
  echo "Scanning folder $path..." . PHP_EOL;
  $entries = glob($path."/*/{.}manifest", GLOB_NOSORT|GLOB_BRACE);
  foreach ($entries as $mfilepath) {
    join_files(1, $mfilepath);    
    $dir = dirname($mfilepath);
    $children = glob_recursive($dir."/content/{.}*.metadata", GLOB_NOSORT|GLOB_BRACE);
    foreach($children as $idx => $child){
      join_files(2, $child);
    }
  }
}
