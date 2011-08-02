<?php

function key_in_array($key, $arr) {
	$flag = false;
	foreach($arr as $k => $v) {
		if ($k == $key) {
			$flag = true;
			break;
		}
	}
	return $flag;
}



/**
 * 获取某个文件夹下的所有文件列表，以“.”开头的除外
 * @param {String} $path 要计算的文件(列表/文件夹)路径，可以是文件路径，文件夹路径，或者文件路径数组
 * @param {String} $baseDir 基于查询的目录
 * @param {Boolean} $deep 是否递归获取深层的文件
 */
function get_dir_list($path = './', $baseDir = './', $deep = false) {
	$list = array();
	
	if (is_array($path)) {
		foreach ($path as $item) {
			$list = array_merge($list, get_dir_list($item, $baseDir, $deep));
		}
	} else {
		$curPath = $baseDir . $path;
		if (is_dir($curPath)) {
			$dir = opendir($curPath);
			$fileList = array();
			while (($file = readdir($dir)) !== false) {
				if (($pos = strpos($file, '.')) === false || $pos > 0) {
					array_push($fileList, $file);
				}
			}
			closedir($dir);
			
			sort($fileList, SORT_STRING);
			
			foreach($fileList as $file) {
				$curFile = $curPath . $file;
				if (is_dir($curFile)) {
					$list = array_merge($list, get_dir_list("$file/", $curPath, $deep));
				} else {
					array_push($list, $curFile);
				}
			}
		} else {
			$list[] = $curPath;
		}
	}
	
	return array_unique($list);
}

function dir_dfs($path, $func, $filter = null) {
	$cur = $path;
	if (file_exists($cur) && (!$filter || $filter($cur))) {
		if ($func($cur) === false) {
			return false;
		}
		if (is_dir($cur)) {
			$dir = opendir($cur);
			$fileList = array();
			while (($f = readdir($dir)) !== false) {
				if ($f != '.' && $f != '..') {
					array_push($fileList, $f);
				}
			}
			closedir($dir);
			
			sort($fileList, SORT_STRING);
			
			foreach($fileList as $file) {
				if (dir_dfs("$cur/$file", $func, $filter) === false) {
					break;
				}
			}
		}
	}
}


/**
 * 获取文件第一块文档注释信息
 */
function parse_source_head_info($content) {
	$info = null;
	$comment = '';
	$frag = explode('/**', $content);
	if (count($frag) >= 2) {
		$frag = explode('*/', $frag[1]);
		if (count($frag) >= 2) {
			$comment = $frag[0];
		}
	}
	if ($comment) {
		$lines = preg_split("/\s\*\s/", $comment);
		$info = array(
			'ignore' => false,
			'class' => '',
			'description' => '',
			'singleton' => false
		);
		$desc = array();
		foreach ($lines as $line) {
			$line = trim($line);
			if (strpos($line, '@') === 0) {
				if (preg_match("/^@(\w+)(\s[\w\.]+)?\n$/", $line, $type)) {
					switch ($type[1]) {
					case 'ignore':
						$info['ignore'] = true;
						break;
					case 'class':
						$info['class'] = trim($type[2]);
						break;
					case 'singleton':
						$info['singleton'] = true;
						break;
					default:
						break;
					}
				}
			} else {
				if (trim($line)) {
					array_push($desc, $line);
				}
			}
		}
		$info['description'] = join('<br />', $desc);
	}
	return $info;
}
?>