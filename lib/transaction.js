// A mock SMTP Transaction

const Notes = require('haraka-notes');
const ResultStore = require('haraka-results')


const MAX_HEADER_LINES = 1000;

class Header {
    constructor (options) {
        this.headers = {};
        this.headers_decoded = {};
        this.header_list = [];
        this.options = options;
        this.results = new ResultStore(this);
    }
    parse () { return true; }
    lines   () { return this.header_list; }
    add (key, val) {
        this.headers[key] = this.headers[key] || [];
        this.headers[key].push(val);
        this.headers_decoded[key] = this.headers_decoded[key] || [];
        this.headers_decoded[key].push(val);
    }
    add_end (key, val) { this.add(key, val); }
    get     (key) { return (this.headers[key] || []).join('\n'); }
    get_all (key) { return this.headers[key] || []; }
    get_decoded (key) { return (this.headers_decoded[key] || []).join('\n'); }
    remove  (key) { delete this.headers[key]; }
}

class Transaction {
    constructor () {
        this.uuid = null;
        this.mail_from = null;
        this.rcpt_to = [];
        this.header_lines = [];
        this.data_lines = [];
        this.attachment_start_hooks = [];
        this.banner = null;
        this.body_filters = [];
        this.data_bytes = 0;
        this.header_pos = 0;
        this.found_hb_sep = false;
        this.body = null;
        this.parse_body = false;
        this.notes = new Notes();
        this.header = new Header();
        this.message_stream = {
            add_line: () => { return true; },
            add_line_end: () => { return true; },
        };
        this.discard_data = false;
        this.resetting = false;
        this.rcpt_count = {
            accept:   0,
            tempfail: 0,
            reject:   0,
        };
        this.data_post_start = null;
        this.data_post_delay = 0;
    }

    ensure_body () {
        if (this.body) return;

        // this.body = new body.Body(this.header);
        this.attachment_start_hooks.forEach(h => {
            this.body.on('attachment_start', h);
        });
        if (this.banner) this.body.set_banner(this.banner);

        this.body_filters.forEach(o => {
            this.body.add_filter((ct, enc, buf) => {
                if ((o.ct_match instanceof RegExp &&
                     o.ct_match.test(ct.toLowerCase())) ||
                        ct.toLowerCase()
                            .indexOf(String(o.ct_match)
                                .toLowerCase()) === 0) {
                    return o.filter(ct, enc, buf);
                }
            });
        });
    }

    add_data (line) {
        if (typeof line === 'string') { // This shouldn't ever really happen...
            line = new Buffer(line, 'binary');
        }
        // check if this is the end of headers line
        if (this.header_pos === 0 &&
            (line[0] === 0x0A || (line[0] === 0x0D && line[1] === 0x0A)) ) {
            this.header.parse(this.header_lines);
            this.header_pos = this.header_lines.length;
            this.found_hb_sep = true;
            if (this.parse_body) {
                this.ensure_body();
            }
        }
        else if (this.header_pos === 0) {
            // Build up headers
            if (this.header_lines.length < MAX_HEADER_LINES) {
                if (line[0] === 0x2E) line = line.slice(1); // Strip leading "."
                this.header_lines.push(
                    line.toString('binary').replace(/\r\n$/, '\n'));
            }
        }
        else if (this.header_pos && this.parse_body) {
            if (line[0] === 0x2E) line = line.slice(1); // Strip leading "."
            let new_line = this.body.parse_more(
                line.toString('binary').replace(/\r\n$/, '\n'));

            if (!new_line.length) {
                return; // buffering for banners
            }

            new_line = new_line.replace(/^\./gm, '..').replace(/\r?\n/gm, '\r\n');
            line = new Buffer(new_line,'binary');
        }

        if (!this.discard_data) this.message_stream.add_line(line);
    }

    end_data (cb) {
        if (!this.found_hb_sep && this.header_lines.length) {
            // Headers not parsed yet - must be a busted email
            // Strategy: Find the first line that doesn't look like a header.
            // Treat anything before that as headers, anything after as body.
            let header_pos = 0;
            for (let i = 0; i < this.header_lines.length; i++) {
                // Anything that doesn't match a header or continuation
                if (!/^(?:([^\s:]*):\s*([\s\S]*)$|[ \t])/.test(this.header_lines[i])) {
                    break;
                }
                header_pos = i;
            }
            const body_lines = this.header_lines.splice(header_pos + 1);
            this.header.parse(this.header_lines);
            this.header_pos = header_pos;
            if (this.parse_body) {
                this.ensure_body();
                for (let j = 0; j < body_lines.length; j++) {
                    this.body.parse_more(body_lines[j]);
                }
            }
        }
        if (this.header_pos && this.parse_body) {
            let data = this.body.parse_end();
            if (data.length) {
                data = data.toString('binary')
                    .replace(/^\./gm, '..')
                    .replace(/\r?\n/gm, '\r\n');
                const line = new Buffer(data, 'binary');

                if (!this.discard_data) this.message_stream.add_line(line);
            }
        }

        if (!this.discard_data) {
            this.message_stream.add_line_end(cb);
        }
        else {
            cb();
        }
    }

    add_header (key, value) {
        this.header.add_end(key, value);
        if (this.header_pos > 0) this.reset_headers();
    }

    add_leading_header (key, value) {
        this.header.add(key, value);
        if (this.header_pos > 0) this.reset_headers();
    }

    reset_headers () {
        const header_lines = this.header.lines();
        this.header_pos = header_lines.length;
    }

    remove_header (key) {
        this.header.remove(key);
        if (this.header_pos > 0) this.reset_headers();
    }

    attachment_hooks (start, data, end) {
        this.parse_body = 1;
        this.attachment_start_hooks.push(start);
    }

    set_banner (text, html) {
        // throw "transaction.set_banner is currently non-functional";
        this.parse_body = true;
        if (!html) {
            html = text.replace(/\n/g, '<br/>\n');
        }
        this.banner = [text, html];
    }

    add_body_filter (ct_match, filter) {
        this.parse_body = true;
        this.body_filters.push({'ct_match': ct_match, 'filter': filter});
    }
}

exports.Transaction = Transaction;

exports.createTransaction = function (uuid) {
    const t = new Transaction();
    t.uuid = uuid || '111111-222222-333-4444444';
    // Initialize MessageStream here to pass in the UUID
    // t.message_stream = new MessageStream({main:{}}, t.uuid, t.header.header_list);
    return t;
}
