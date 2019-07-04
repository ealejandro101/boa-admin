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

defined('APP_EXEC') or die( 'Access not allowed');

define("MP4", "mp4");
define("WEBM", "webm");
define("OGV", "ogv");
define("VIDEO_TASK_QUEUE_PATH", APP_DATA_PATH . "/plugins/editor.video/transcode.json");

/**
 * Class to manage video conversion and others
 *
 * @package    [App Plugins]
 * @category   [Editor]
 * @copyright  2019 BoA Project - davidhernet@gmail.com
 * @license    https://www.gnu.org/licenses/agpl-3.0.html GNU Affero GPL v3 or later
 */
class VideoManager {

    private $availableSizes;
    private $filename;
    private $videoinfo;


    function __construct($filename, $availablesizes){

        if (!file_exists($filename)) {
            throw new \Exception("File -$filename- not found in " . __FUNCTION__ . " method");
        }

        $this->availableSizes = $availablesizes;
        $this->filename = $filename;
        $this->videoinfo = $this->getVideoInfo();
    }

    public function ensureFormat($format, $alternatepath) {
        foreach ($this->availableSizes as $size => $value) {
            $alternatefilename = "$alternatepath/$size.$format";

            if (!file_exists($alternatefilename)) {
                $this->transcode($alternatefilename, $format, $size);
            }
        }
    }

    private function transcode($output, $format, $size) {
        $outputdirname = pathinfo($output, PATHINFO_DIRNAME);

        switch ($format) {
            case MP4:
                $this->toMp4($output, $size);
                break;

            case WEBM:
                $this->toWebM($output, $size);
                break;

            case OGV:
                $this->toOgv($output, $size);
                break;
        }
    }

    private function toMp4($output, $size) {
        $input = $this->clearFilename();
        list($width, $height) = $this->availableSizes[$size];

        list($fw, $fh) = $this->defineScaleFactors($width, $height);

        $command = escapeshellcmd("ffmpeg -i '$input' -c:v libx264 -crf 19 -level 3.1 -preset slow -filter:v \"scale=$fw:$fh,pad=$width:$height:(ow-iw)/2:(oh-ih)/2\" -sws_flags lanczos -c:a aac -movflags faststart '$output'");

        $result = shell_exec($command);
    }

    private function toWebM($output, $size) {
        $input = $this->clearFilename();
        list($width, $height) = $this->availableSizes[$size];

        list($fw, $fh) = $this->defineScaleFactors($width, $height);

        $command = escapeshellcmd("ffmpeg -i '$input' -c:v libvpx -c:a libvorbis -filter:v \"scale=$fw:$fh,pad=$width:$height:(ow-iw)/2:(oh-ih)/2\" '$output'");

        $result = shell_exec($command);
    }

    private function toOgv($output, $size) {
        $input = $this->clearFilename();
        list($width, $height) = $this->availableSizes[$size];

        list($fw, $fh) = $this->defineScaleFactors($width, $height);

        $command = escapeshellcmd("ffmpeg -i '$input' -codec:v libtheora -qscale:v 7 -codec:a libvorbis -qscale:a 5 -filter:v \"scale=$fw:$fh,pad=$width:$height:(ow-iw)/2:(oh-ih)/2\" '$output'");

        $result = shell_exec($command);
    }

    public function generateThumb($outputdir) {

        // Only video can be used to build Thumb image
        if ($this->getCodecType() != 'video') return;

        $input = $this->clearFilename();
        $thumbpath = $outputdir . "/thumb.png";
        if (file_exists($thumbpath)) return;

        list($fw, $fh) = $this->defineScaleFactors(256, 256);

        $duration = $this->getDuration();
        $d = $duration / 2;

        $command = escapeshellcmd("ffmpeg -ss $d -i '$input' -vf \"scale=$fw:$fh,pad=256:256:(ow-iw)/2:(oh-ih)/2\" -frames:v 1 '$thumbpath'");
        $result = shell_exec($command);
    }

    public function generatePreview($outputdir) {

        // Only video can be used to build preview image
        if ($this->getCodecType() != 'video') return;

        $input = $this->clearFilename();
        $previewpath = $outputdir . "/preview.gif";
        if (file_exists($previewpath)) return;

        list($fw, $fh) = $this->defineScaleFactors(256, 256);

        $nb_frames = $this->getNBFrames();

        if ($nb_frames) {
            $nb = round($nb_frames / 10);

            $command = escapeshellcmd("ffmpeg -i '$input' -vf \"scale=$fw:$fh,pad=256:256:(ow-iw)/2:(oh-ih)/2, select=not(mod(n\, $nb)), setpts=N/1/TB\" -frames 10 '$previewpath'");
        }
        else {
            $command = escapeshellcmd("ffmpeg -i '$input' -vf \"scale=$fw:$fh,pad=256:256:(ow-iw)/2:(oh-ih)/2\" -t 10 -r 1 '$previewpath'");
        }

        $result = shell_exec($command);
    }

    public function getVideoInfo() {
        $input = $this->clearFilename();
        $command = "ffprobe -v quiet -print_format json -show_format -show_streams -hide_banner '$input' 2>&1";
        $output = array();
        exec($command, $output);
        return json_decode(implode("", $output), true);
    }

    public function clearFilename() {
        $name = str_replace("'", "\'", $this->filename);

        return $name;
    }

    public function getWidth() {
        if (is_array($this->videoinfo)) {
            $width = $this->videoinfo['streams'][0]['width'];
        }
        else {
            $width = $this->videoinfo->streams->width;
        }

        return $width;
    }

    public function getHeight() {
        if (is_array($this->videoinfo)) {
            $height = $this->videoinfo['streams'][0]['height'];
        }
        else {
            $height = $this->videoinfo->streams->height;
        }

        return $height;
    }

    private function defineScaleFactors($width, $height) {

        $videowidth = $this->getWidth();
        $videoheight = $this->getHeight();

        $res = array();
        if ($videowidth < $width || $videoheight < $height) {
            if ($videowidth < $width && $videoheight < $height) {
                $res[0] = $videowidth;
                $res[1] = $videoheight;
            }
            else if ($videowidth < $width) {
                $res[0] = '-1';
                $res[1] = $height;
            }
            else {
                $res[0] = $width;
                $res[1] = '-1';
            }
        }
        else if ($videowidth - $width > $videoheight - $height) {
            $res[0] = $width;
            $res[1] = '-1';
        }
        else {
            $res[0] = '-1';
            $res[1] = $height;
        }

        return $res;
    }

    public function getDuration() {
        if (is_array($this->videoinfo)) {
            $duration = $this->videoinfo['streams'][0]['duration'];
        }
        else {
            $duration = $this->videoinfo->streams->duration;
        }

        return floatval($duration);
    }

    public function getNBFrames() {
        if (is_array($this->videoinfo)) {
            $nb_frames = $this->videoinfo['streams'][0]['nb_frames'];
        }
        else {
            $nb_frames = $this->videoinfo->streams->nb_frames;
        }

        return intval($nb_frames);
    }

    public function getCodecType() {
        if (is_array($this->videoinfo)) {
            $codec_type = $this->videoinfo['streams'][0]['codec_type'];
        }
        else {
            $codec_type = $this->videoinfo->streams->codec_type;
        }

        return $codec_type;
    }
}
