var loggly;

function loadLoggly() {
    try {
        loggly = require('loggly');
    } catch (e) {
        throw new Error('Attempted to use loggly transport without installing the loggly module');
    }
}

var Loggly = module.exports = function (opts, name) {
    if (!(this instanceof Loggly)) return new Loggly(opts, name);
    loadLoggly();

    this.name = name || '';
    this.source_host - opts.source_host;
    this.client = loggly.createClient({
        token: opts.token,
        subdomain: opts.subdomain,
        tags: opts.tags || [ 'NodeJS' ],
        json: true
    });
};

Loggly.prototype.log = function (time, level, module, data, tags) {
    var packet = {};
    var name = module || this.name;
    var source = this.source || name;

    packet['@timestamp'] = time.toISOString();
    packet['@tags'] = tags;
    packet['@type'] = 'bucker';
    packet['@source'] = source;
    if (this.source_host) packet['@source_host'] = this.source_host;
    packet['@module'] = name;
    packet['@level'] = level;
    packet['@message'] = data;

    this.send(packet);
};

Loggly.prototype.access = function (module, data, tags) {
    var packet = {};
    var name = module || this.name;
    var source = this.source || name;

    packet['@timestamp'] = data.time.toISOString();
    packet['@tags'] = tags;
    packet['@type'] = 'bucker_access';
    packet['@source'] = source;
    if (this.source_host) packet['@source_host'] = this.source_host;
    packet['@module'] = module;
    packet['@url'] = data.url;
    packet['@client'] = data.remote_ip;
    packet['@size'] = data.length;
    packet['@responsetime'] = data.response_time;
    packet['@status'] = data.status;
    packet['@method'] = data.method;
    packet['@http_referrer'] = data.referer;
    packet['@http_user_agent'] = data.agent;
    packet['@http_version'] = data.http_ve;
    packet['@message'] = [data.method, data.url, data.status].join(' ');
    // Some frameworks (such as Express) provide a "user" object on 
    // request objects that are authenticated
    if (data.user) packet['@user'] = data.user;

    this.send(packet);
};

Loggly.prototype.exception = function (time, module, err, tags) {
    var packet = {};
    var name = module || this.name;
    var source = this.source || name;

    packet['@timestamp'] = time.toISOString();
    packet['@tags'] = tags;
    packet['@type'] = 'bucker';
    packet['@source'] = source;
    if (this.source_host) packet['@source_host'] = this.source_host;
    packet['@stack'] = err.stack.split('\n');
    packet['@module'] = module;
    packet['@level'] = 'exception';
    packet['@message'] = err.stack;

    this.send(packet);
};

Loggly.prototype.stat = function (time, module, statName, type, value, tags) {
    var packet = {};
    var name = module || this.name;
    var source = this.source || name;

    packet['@timestamp'] = time.toISOString();
    packet['@tags'] = tags;
    packet['@type'] = 'bucker';
    packet['@source'] = source;
    if (this.source_host) packet['@source_host'] = this.source_host;
    packet['@module'] = module;
    packet['@level'] = 'stat';
    packet['@name'] = statName;
    packet['@type'] = type;
    packet['@value'] = value;
    packet['@message'] = statName + '(' + type + '): ' + value;

    this.send(packet);
};

Loggly.prototype.send = function (data) {
    this.client.log(data);
};
