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
 
namespace BoA\Plugins\Editor\Video;

use BoA\Core\Http\Controller;
use BoA\Core\Http\HTMLWriter;
use BoA\Core\Plugins\Plugin;
use BoA\Core\Services\ConfService;
use BoA\Core\Utils\Utils;
use BoA\Core\Xml\ManifestNode;
use BoA\Plugins\Core\Log\Logger;
use BoA\Threading\ITaskProviderFactory;
use BoA\Plugins\Editor\Video\VideoTasks;

defined('APP_EXEC') or die( 'Access not allowed');

/**
 * This is a one-line short description of the file/class.
 *
 * You can have a rather longer description of the file/class as well,
 * if you like, and it can span multiple lines.
 *
 * @package    [App Plugins]
 * @category   [Editor]
 * @copyright  2017 BoA Project
 * @license    https://www.gnu.org/licenses/agpl-3.0.html GNU Affero GPL v3 or later
 */
class VideoReader extends Plugin implements ITaskProviderFactory {
	
	public function switchAction($action, $httpVars, $filesVars){
		
		if(!isSet($this->actions[$action])) return false;
    	
		$repository = ConfService::getRepository();
		if(!$repository->detectStreamWrapper(true)){
			return false;
		}
		
		$streamData = $repository->streamData;
    	$destStreamURL = $streamData["protocol"]."://".$repository->getId();
		    	
		if($action == "read_video_data"){
			Logger::debug("Reading video");
            $file = Utils::decodeSecureMagic($httpVars["file"]);
            $node = new ManifestNode($destStreamURL.$file);
            session_write_close();
            $filesize = filesize($destStreamURL.$file);
 			$filename = $destStreamURL.$file;

            //$fp = fopen($destStreamURL.$file, "r");
 			if(preg_match("/\.ogv$/", $file)){
				header("Content-Type: video/ogg; name=\"".basename($file)."\"");
 			}else if(preg_match("/\.mp4$/", $file)){
 				header("Content-Type: video/mp4; name=\"".basename($file)."\"");
 			}else if(preg_match("/\.m4v$/", $file)){
 				header("Content-Type: video/x-m4v; name=\"".basename($file)."\"");
 			}else if(preg_match("/\.webm$/", $file)){
 				header("Content-Type: video/webm; name=\"".basename($file)."\"");
 			}

			if ( isset($_SERVER['HTTP_RANGE']) && $filesize != 0 )
			{
				Logger::debug("Http range", array($_SERVER['HTTP_RANGE']));
				// multiple ranges, which can become pretty complex, so ignore it for now
				$ranges = explode('=', $_SERVER['HTTP_RANGE']);
				$offsets = explode('-', $ranges[1]);
				$offset = floatval($offsets[0]);

				$length = floatval($offsets[1]) - $offset;
				if (!$length) $length = $filesize - $offset;
				if ($length + $offset > $filesize || $length < 0) $length = $filesize - $offset;
				header('HTTP/1.1 206 Partial Content');

				header('Content-Range: bytes ' . $offset . '-' . ($offset + $length - 1) . '/' . $filesize);
				header('Accept-Ranges:bytes');
				header("Content-Length: ". $length);
				$file = fopen($filename, 'rb');
				fseek($file, 0);
				$relOffset = $offset;
				while ($relOffset > 2.0E9)
				{
					// seek to the requested offset, this is 0 if it's not a partial content request
					fseek($file, 2000000000, SEEK_CUR);
					$relOffset -= 2000000000;
					// This works because we never overcome the PHP 32 bit limit
				}
				fseek($file, $relOffset, SEEK_CUR);

                while(ob_get_level()) ob_end_flush();
				$readSize = 0.0;
				while (!feof($file) && $readSize < $length && connection_status() == 0)
				{
					echo fread($file, 2048);
					$readSize += 2048.0;
					flush();
				}
				fclose($file);
			} else {	
 				$fp = fopen($filename, "rb");
				header("Content-Length: ".$filesize);				
				header("Content-Range: bytes 0-" . ($filesize - 1) . "/" . $filesize. ";");			
				header('Cache-Control: public');
				
				$class = $streamData["classname"];
				$stream = fopen("php://output", "a");
				call_user_func(array($streamData["classname"], "copyFileInStream"), $destStreamURL.$file, $stream);
				fflush($stream);
				fclose($stream);
			}
            Controller::applyHook("node.read", array($node));
		}else if($action == "get_sess_id"){
			HTMLWriter::charsetHeader("text/plain");
			print(session_id());
		}
	}

    /**
     * @param ManifestNode $node
     */
    public function videoAlternateVersions(&$node){
        if(!preg_match('/\.mpg$|\.mp4$|\.ogv$|\.webm$/i', $node->getLabel())) return;

        $path = $node->getUrl();
        $repository = $node->getRepository();
        $path = $repository->getOption("PATH");
        $relpath = $node->getPath();
        $parts = explode("/", ltrim($relpath, "/"));
        $root = array_shift($parts);
        $relpath = implode("/", $parts);

        $altpath = $path . '/' . $root . '/.alternate/' . $relpath . '/';

        $entries = glob($altpath."/*.{[mM][pP]4,[wW][eE][bB][mM],[oO][gG][vV]}", GLOB_NOSORT|GLOB_BRACE);

        $alternates = array();

        foreach ($entries as $entry => $value) {
        	# code...
        	$info = pathinfo($value);
        	$alternates[$info['filename']] = $altpath . "/" . $info['basename'];
        }
        
        $extra = array("alternates" => $alternates);

        if (file_exists($altpath . "thumb.png")) {
        	$extra["customicon"] = $altpath . "thumb.png";
        }

        if (file_exists($altpath . "preview.gif")) {
        	$extra["preview"] = $altpath . "preview.gif";
        }

        //var_dump($extra);
        $node->mergeMetadata($extra);
    }

    /**
     * @param ManifestNode $node
     */
	public function getTaskProvider() {
		return isset($this->taskProvider) ? $this->taskProvider : ($this->taskProvider = new VideoTasks());
	}
}
