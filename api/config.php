<?php
declare(strict_types=1);

$example = require __DIR__ . '/config.example.php';
$localPath = __DIR__ . '/config.local.php';
$local = is_file($localPath) ? require $localPath : [];

return array_replace_recursive($example, is_array($local) ? $local : []);
