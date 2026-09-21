const feeRoutes = [
  ["Protocol treasury", "50%"],
  ["Creator", "30%"],
  ["Integration", "20%"]
] as const;

function Progress({ value }: { readonly value: number }) {
  return (
    <div
      className="progress"
      role="progressbar"
      aria-valuenow={value}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      <span style={{ width: `${value}%` }} />
    </div>
  );
}

export function App() {
  return (
    <div className="shell">
      <header>
        <a className="brand" href="#top" aria-label="LoomPad home">
          <span>LP</span> LoomPad
        </a>
        <nav aria-label="Primary">
          <a href="#launches">Launches</a>
          <a href="#manifest">Manifest</a>
          <a href="#developers">Developers</a>
        </nav>
        <button type="button" className="connect">
          Connect wallet
        </button>
      </header>

      <main id="top">
        <section className="hero">
          <div>
            <p className="eyebrow">
              <i /> SOLANA DEVNET · REFERENCE CLIENT
            </p>
            <h1>
              Protocol console for
              <br />
              <em>programmable launches.</em>
            </h1>
            <p className="lede">
              Create, inspect, and interact with transparent launch configurations. This interface
              is one client of the permissionless LoomPad protocol.
            </p>
            <div className="actions">
              <button type="button" className="primary">
                Create launch <span>→</span>
              </button>
              <a href="#developers">Read the SDK docs</a>
            </div>
          </div>
          <aside className="terminal" aria-label="SDK example">
            <div className="terminal-bar">
              <span />
              <span />
              <span />
              <b>create-launch.ts</b>
            </div>
            <pre>
              <code>
                <mark>import</mark> {"{ LoomPadClient }"} <mark>from</mark>
                {"\n"} <q>"@loompad/sdk"</q>;{"\n\n"}
                <mark>const</mark> signature = <mark>await</mark> client.createLaunch({"{\n"}{" "}
                manifest: launchManifest,{"\n"} modules: [<q>"curve"</q>, <q>"vesting"</q>]{"\n}"})
              </code>
            </pre>
            <div className="terminal-status">
              <span>✓</span> Configuration validated locally
            </div>
          </aside>
        </section>

        <section className="stats" aria-label="Protocol status">
          <div>
            <small>PROGRAM STATUS</small>
            <strong>
              <i /> Local / Devnet
            </strong>
          </div>
          <div>
            <small>MANIFEST SPEC</small>
            <strong>v1.0.0</strong>
          </div>
          <div>
            <small>SUPPORTED CURVES</small>
            <strong>2 modules</strong>
          </div>
          <div>
            <small>CLIENT TRUST</small>
            <strong>Non-custodial</strong>
          </div>
        </section>

        <section className="workspace" id="launches">
          <div className="section-heading">
            <div>
              <p className="eyebrow">EXAMPLE STATE</p>
              <h2>Inspect a launch</h2>
            </div>
            <button type="button" className="ghost">
              View raw account ↗
            </button>
          </div>
          <div className="grid">
            <article className="launch-card">
              <div className="token">
                <span>LP</span>
                <div>
                  <h3>LoomPad Example</h3>
                  <p>LOOM · 9 decimals</p>
                </div>
                <b>ACTIVE</b>
              </div>
              <div className="metric-row">
                <div>
                  <small>QUOTE RESERVE</small>
                  <strong>842.19 SOL</strong>
                </div>
                <div>
                  <small>TOKENS SOLD</small>
                  <strong>61.4%</strong>
                </div>
                <div>
                  <small>TRADING FEE</small>
                  <strong>1.00%</strong>
                </div>
              </div>
              <div className="curve">
                <div>
                  <span>Graduation progress</span>
                  <strong>68.2%</strong>
                </div>
                <Progress value={68.2} />
                <p>Quote-reserve threshold · adapter allowlisted</p>
              </div>
              <div className="trade">
                <label>
                  Trade input<span>Balance 12.40 SOL</span>
                  <div>
                    <input inputMode="decimal" defaultValue="1.00" aria-label="Trade amount" />
                    <b>SOL</b>
                  </div>
                </label>
                <button type="button" className="primary">
                  Review trade
                </button>
              </div>
            </article>

            <aside className="details" id="manifest">
              <div className="tabs">
                <button type="button" className="selected">
                  Manifest
                </button>
                <button type="button">Vesting</button>
                <button type="button">Security</button>
              </div>
              <dl>
                <div>
                  <dt>Mint authority</dt>
                  <dd>
                    Revoked <span className="ok">✓</span>
                  </dd>
                </div>
                <div>
                  <dt>Freeze authority</dt>
                  <dd>
                    Revoked <span className="ok">✓</span>
                  </dd>
                </div>
                <div>
                  <dt>Configuration</dt>
                  <dd>Immutable</dd>
                </div>
                <div>
                  <dt>Curve</dt>
                  <dd>Constant product</dd>
                </div>
              </dl>
              <h4>Fee routing</h4>
              {feeRoutes.map(([name, value]) => (
                <div className="route" key={name}>
                  <span>{name}</span>
                  <b>{value}</b>
                </div>
              ))}
              <button type="button" className="manifest-button">
                View LaunchManifest.json <span>→</span>
              </button>
            </aside>
          </div>
        </section>

        <section className="integrations" id="developers">
          <p className="eyebrow">ONE PROTOCOL · MANY CLIENTS</p>
          <h2>
            The frontend is optional.
            <br />
            The protocol is the product.
          </h2>
          <div className="client-row">
            {["Wallets", "Bots", "Web apps", "Games", "Terminals", "AI agents"].map(
              (item, index) => (
                <div key={item}>
                  <span>{["◫", "⌁", "◇", "⌘", "▱", "✦"][index]}</span>
                  {item}
                </div>
              )
            )}
          </div>
          <p className="flow">
            CLIENTS <b>→</b> SDK / API <b>→</b> LOOMPAD PROGRAM <b>→</b> SOLANA
          </p>
        </section>
      </main>
      <footer>
        <span>LoomPad · Open protocol infrastructure</span>
        <span>Apache-2.0 · Not audited · Devnet only</span>
      </footer>
    </div>
  );
}
