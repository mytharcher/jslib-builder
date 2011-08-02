(function (host, undefined) {
	function mix (target, source) {
		for (var i in source)
			if (source.hasOwnProperty(i))
				target[i] = source[i];
	}
	
	var <?php echo $data['varList']; ?>;
<?php echo $data['scriptContent']; ?>
<?php echo "\tvar packages = " . $data['jsonContent'] . ";\r\n"; ?>
<?php
foreach ($data['jsonStructure'] as $name => $json) {
	$pack = $data['packages'][$name];
	if (isset($pack['mixins'])) {
		foreach ($pack['mixins'] as $mixin) {
			echo "\tmix(packages['$name'], packages['$mixin']);\r\n";
		}
	}
	if (!isset($pack['hidden']) || !$pack['hidden']) {
		echo "\thost['$name'] = packages['$name'];\r\n";
	}
	//echo "\tmix(host, packages);\r\n";
}
?>
})(this);